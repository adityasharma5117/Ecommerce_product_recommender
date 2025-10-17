import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateRecommendationExplanation } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

// Cache for category preferences to avoid recalculating
const categoryCache = new Map<string, { categories: string[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'Missing user_id parameter' }, { status: 400 });
    }

    // Check cache first
    const cached = categoryCache.get(userId);
    const now = Date.now();
    
    let topCategories: string[] = [];
    let userHistory: any[] = [];
    let viewedProductIds: string[] = [];

    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      topCategories = cached.categories;
      
      // Still need fresh interaction data for viewed products
      const { data: recentInteractions } = await supabase
        .from('user_interactions')
        .select('product_id')
        .eq('user_id', userId)
        .limit(50); // Only get recent ones for viewed products
      
      viewedProductIds = recentInteractions?.map(i => i.product_id) || [];
    } else {
      // Fetch fresh interaction data
      const { data: interactions, error: interactionsError } = await supabase
        .from('user_interactions')
        .select('product_id, action_type, products(id, name, category)')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(100); // Limit to recent interactions for better performance

      if (interactionsError) {
        console.error('Error fetching interactions:', interactionsError);
        return NextResponse.json({ error: 'Failed to fetch user interactions' }, { status: 500 });
      }

      if (!interactions || interactions.length === 0) {
        return NextResponse.json({ recommendations: [] });
      }

      userHistory = interactions.map((i: any) => ({
        category: i.products?.category || '',
        action: i.action_type,
      }));

      // Calculate category preferences with weighted scoring
      const categoryScores: Record<string, number> = {};
      interactions.forEach((interaction: any, index: number) => {
        const category = interaction.products?.category;
        if (category) {
          // Weight recent interactions more heavily
          const weight = Math.max(1, 10 - Math.floor(index / 10));
          const actionWeight = interaction.action_type === 'purchase' ? 3 : 
                              interaction.action_type === 'add_to_cart' ? 2 : 1;
          categoryScores[category] = (categoryScores[category] || 0) + (weight * actionWeight);
        }
      });

      topCategories = Object.entries(categoryScores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([cat]) => cat);

      viewedProductIds = interactions.map((i: any) => i.product_id);

      // Cache the results
      categoryCache.set(userId, { categories: topCategories, timestamp: now });
    }

    // If no categories found, return popular products
    if (topCategories.length === 0) {
      const { data: popularProducts, error: popularError } = await supabase
        .from('products')
        .select('*')
        .order('id')
        .limit(6);

      if (popularError) {
        console.error('Error fetching popular products:', popularError);
        return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
      }

      const recommendations = await Promise.all(
        (popularProducts || []).map(async (product) => {
          try {
            const explanation = await generateRecommendationExplanation(
              product.name,
              product.category,
              []
            );
            return { product, explanation };
          } catch (error) {
            return {
              product,
              explanation: `This ${product.category} product is popular and might interest you.`,
            };
          }
        })
      );

      return NextResponse.json({ recommendations });
    }

    // Get recommendations with improved query
    const { data: recommendedProducts, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('category', topCategories)
      .not('id', 'in', viewedProductIds.length > 0 ? `(${viewedProductIds.join(',')})` : '(0)')
      .limit(8); // Get more products to have better selection

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
    }

    // If not enough products in preferred categories, fill with other categories
    let finalProducts = recommendedProducts || [];
    if (finalProducts.length < 6) {
      const { data: additionalProducts } = await supabase
        .from('products')
        .select('*')
        .not('category', 'in', `(${topCategories.join(',')})`)
        .not('id', 'in', viewedProductIds.length > 0 ? `(${viewedProductIds.join(',')})` : '(0)')
        .limit(6 - finalProducts.length);
      
      if (additionalProducts) {
        finalProducts = [...finalProducts, ...additionalProducts];
      }
    }

    // Generate explanations in parallel with better error handling
    const recommendations = await Promise.allSettled(
      finalProducts.slice(0, 6).map(async (product) => {
        try {
          const explanation = await generateRecommendationExplanation(
            product.name,
            product.category,
            userHistory
          );
          return { product, explanation };
        } catch (error) {
          console.error(`Failed to generate explanation for product ${product.name}:`, error);
          return {
            product,
            explanation: `We think you'd like ${product.name} because it matches your interests in ${product.category}.`,
          };
        }
      })
    );

    const successfulRecommendations = recommendations
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value);

    return NextResponse.json({ recommendations: successfulRecommendations });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
