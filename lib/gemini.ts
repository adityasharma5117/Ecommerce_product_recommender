export async function generateRecommendationExplanation(
  productName: string,
  productCategory: string,
  userHistory: { category: string; action: string }[]
): Promise<string> {
  // Prefer a server-side-only env var. Fall back to NEXT_PUBLIC_* for local/dev convenience.
  const apiKey =
    process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("generateRecommendationExplanation: GEMINI API key not set");
    return "This product matches your interests based on your browsing history.";
  }

  // Debugging helper: if GEMINI_MOCK is set, return a canned explanation immediately
  if (process.env.GEMINI_MOCK === "1") {
    return `We think you'd like ${productName} because it matches your interests in ${productCategory} and similar items you've viewed.`;
  }

  // Quick disable option for troubleshooting
  if (process.env.GEMINI_DISABLED === "1") {
    console.log("Gemini API disabled via environment variable");
    return `We think you'd like ${productName} because it matches your interests in ${productCategory} and similar items you've viewed.`;
  }

  // Create a fallback explanation immediately
  const fallbackExplanation = `We think you'd like ${productName} because it matches your interests in ${productCategory} and similar items you've viewed.`;

  // Call the API directly with proper timeout handling
  try {
    return await callGeminiAPI(productName, productCategory, userHistory, apiKey);
  } catch (error) {
    console.error("Error in Gemini API call:", error);
    return fallbackExplanation;
  }
}

async function callGeminiAPI(
  productName: string,
  productCategory: string,
  userHistory: { category: string; action: string }[],
  apiKey: string
): Promise<string> {
  const categoryCount = userHistory.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([cat]) => cat);

  const hasPurchases = userHistory.some((h) => h.action === "purchase");

  const prompt = `Why recommend ${productName}? Answer in one sentence.`;

  // Create fallback explanation
  const fallbackExplanation = `We think you'd like ${productName} because it matches your interests in ${productCategory} and similar items you've viewed.`;

  // Small retry/backoff for transient errors
  const maxRetries = 2;
  const timeoutMs = 15000; // 15s - increased timeout since API is working but slow

  // Try different model configurations as fallback
  const modelConfigs = [
    { model: "gemini-2.0-flash", version: "v1" },
    { model: "gemini-2.0-flash-001", version: "v1" },
    { model: "gemini-2.5-flash", version: "v1" },
    { model: "gemini-2.5-pro", version: "v1" }
  ];


  for (let configIndex = 0; configIndex < modelConfigs.length; configIndex++) {
    const config = modelConfigs[configIndex];
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // Use environment variables if set, otherwise use current config
      let model = process.env.GEMINI_MODEL || config.model;
      // allow the env to be set either as 'models/gemini-1.5-flash' or 'gemini-1.5-flash'
      if (model.startsWith("models/")) {
        model = model.split("/")[1];
      }
      const apiVersion = process.env.GEMINI_API_VERSION || config.version;
      const method = process.env.GEMINI_METHOD || "generateContent";

      const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:${method}`;

      // Debug log to help diagnosis (will appear in server logs)
      console.log(`Calling Gemini API with model: ${model}, version: ${apiVersion}`);
      console.log(`Request URL: ${url}`);
      console.log(`Attempt ${attempt + 1}/${maxRetries + 1} for config ${configIndex + 1}/${modelConfigs.length}`);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 50,
          },
        }),
      });

      clearTimeout(id);
      console.log(`Fetch request completed. Status: ${response.status}`);

      if (!response.ok) {
        const text = await response.text().catch(() => "<no body>");
        const err = new Error(
          `Gemini API request failed with status ${response.status}: ${text}`
        );
        
        // If it's a 404 (model not found), try next config instead of retrying
        if (response.status === 404) {
          if (configIndex < modelConfigs.length - 1) {
            console.debug(`Model ${model} not found, trying next configuration...`);
            break; // Break out of retry loop to try next config
          }
        }
        
        // Retry on transient status codes
        if (response.status >= 500 || response.status === 429) {
          if (attempt < maxRetries) {
            const backoff = 500 * Math.pow(2, attempt);
            await new Promise((r) => setTimeout(r, backoff));
            continue;
          }
        }
        throw err;
      }

      const data = await response.json().catch(() => null);
      console.log("Response data received:", data ? "Yes" : "No");
      
      // Check if we have a valid response with text content
      const candidate = data?.candidates?.[0];
      const explanation = candidate?.content?.parts?.[0]?.text;
      
      console.log("Explanation extracted:", explanation ? "Yes" : "No");
      console.log("Finish reason:", candidate?.finishReason);
      
      if (explanation) {
        return explanation;
      } else {
        console.warn("No explanation text found in response, using fallback");
        return fallbackExplanation;
      }
    } catch (error: any) {
      clearTimeout(id);
      // If aborted, include that context
      if (error?.name === "AbortError") {
        console.warn("Gemini request aborted (timeout)");
      }

      // If last attempt for this config, try next config or return fallback
      if (attempt === maxRetries) {
        if (configIndex < modelConfigs.length - 1) {
          console.debug(`All retries failed for config ${configIndex}, trying next configuration...`);
          break; // Break out of retry loop to try next config
        } else {
          console.error("Error generating explanation:", error);
          return fallbackExplanation;
        }
      }

      // otherwise wait and retry
      const backoff = 500 * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  }

  // Fallback (shouldn't reach)
  return fallbackExplanation;
}
