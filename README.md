# E-commerce Product Recommender

An intelligent product recommendation system built with Next.js, Supabase, and Google's Gemini AI. This application analyzes user browsing behavior to suggest personalized products with AI-generated explanations.

## Features

- **Smart Product Recommendations**: Analyzes user interactions (views, purchases) to recommend relevant products
- **AI-Powered Explanations**: Uses Google Gemini to generate natural-language explanations for each recommendation
- **User Behavior Tracking**: Records product views and purchases to improve recommendations
- **Beautiful UI**: Modern, responsive design with Framer Motion animations
- **Real-time Updates**: Interactive product cards with smooth transitions and hover effects

## Tech Stack

- **Frontend**: Next.js 13 (App Router), React, TailwindCSS
- **UI Components**: shadcn/ui, Lucide Icons
- **Animations**: Framer Motion
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini API

## Database Schema

### Products Table
- `id` (uuid): Primary key
- `name` (text): Product name
- `description` (text): Product description
- `category` (text): Product category
- `price` (numeric): Product price
- `image_url` (text): Unsplash image URL

### Users Table
- `id` (uuid): Primary key
- `name` (text): User name
- `email` (text): User email (unique)

### User Interactions Table
- `id` (uuid): Primary key
- `user_id` (uuid): Foreign key to users
- `product_id` (uuid): Foreign key to products
- `action_type` (text): 'view', 'add_to_cart', or 'purchase'
- `timestamp` (timestamptz): When the interaction occurred

## Setup Instructions

### 1. Environment Variables

Add the following to your `.env` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

### 2. Get Your API Keys

**Supabase:**
- Sign up at [supabase.com](https://supabase.com)
- Create a new project
- Find your project URL and anon key in Settings > API

**Google Gemini:**
- Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
- Create an API key for Gemini
- Add it to your environment variables

### 3. Database Setup

The database is already set up with:
- All necessary tables (products, users, user_interactions)
- Row Level Security (RLS) policies
- 10 pre-seeded products with Unsplash images
- 3 test users with interaction history

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## How It Works

### Recommendation Algorithm

1. **User Analysis**: Fetches all interactions for the selected user
2. **Category Preference**: Identifies top categories based on user activity
3. **Product Filtering**: Finds products in preferred categories that haven't been viewed
4. **AI Explanation**: Generates personalized explanations using Gemini API

### API Endpoints

#### POST `/api/interactions`
Records user interactions (view, add_to_cart, purchase)

**Request Body:**
```json
{
  "user_id": "uuid",
  "product_id": "uuid",
  "action_type": "view"
}
```

#### GET `/api/recommendations?user_id={uuid}`
Returns personalized product recommendations with AI-generated explanations

**Response:**
```json
{
  "recommendations": [
    {
      "product": {
        "id": "uuid",
        "name": "Product Name",
        "description": "...",
        "category": "Electronics",
        "price": 299.99,
        "image_url": "..."
      },
      "explanation": "AI-generated explanation..."
    }
  ]
}
```

## Pages

### Home Page (`/`)
- Displays all available products in a responsive grid
- Select a user to track interactions
- Click "View" to record a product view
- Click "Add to Cart" to record a purchase
- Smooth animations on card hover and scroll

### Dashboard Page (`/dashboard`)
- Shows personalized recommendations for the selected user
- Each product includes an AI-generated "Why this product?" explanation
- Dynamic loading states with spinner
- Empty state for users with no browsing history

## Product Images

All product images are sourced from [Unsplash](https://unsplash.com), featuring:
- Premium Wireless Headphones
- Smart Fitness Watch
- Leather Laptop Bag
- Minimalist Desk Lamp
- Ergonomic Office Chair
- Stainless Steel Water Bottle
- Wireless Mechanical Keyboard
- Indoor Plant Set
- Premium Coffee Maker
- Designer Sunglasses

## Key Components

### ProductCard Component
- Reusable product display with image, name, price, and category
- Optional AI explanation section
- Framer Motion animations for smooth interactions
- Responsive design with hover effects

### Gemini Integration
- `lib/gemini.ts`: Helper function for generating recommendation explanations
- Contextual prompts based on user's browsing history
- Fallback messages if API is unavailable
- Temperature and token settings optimized for concise, friendly responses

## Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Development Notes

- The app uses Next.js App Router (not Pages Router)
- All client components are marked with `'use client'`
- API routes use `force-dynamic` for real-time data
- Framer Motion provides all animations
- Toast notifications for user feedback

## Future Enhancements

- Add collaborative filtering for better recommendations
- Include product ratings and reviews
- Implement shopping cart functionality
- Add user authentication
- Create admin dashboard for product management
- A/B test different recommendation strategies
