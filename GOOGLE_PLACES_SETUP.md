# Google Places API Setup Guide

## Quick Setup Steps

### 1. Get API Key
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Create new project or select existing
- Go to **APIs & Services** → **Library**
- Search for **"Places API"** and enable it
- Go to **Credentials** → **Create Credentials** → **API Key**

### 2. Secure Your API Key
- Click on your API key in Credentials
- Under "Application restrictions": select **"HTTP referrers"**
- Add your domains:
  - `localhost:3001`
  - `yourdomain.com`
- Under "API restrictions": select **"Places API"** only

### 3. Add to Environment
Create or update `.env.local`:
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### 4. Restart Development Server
```bash
npm run dev
```

## Features
- ✅ Full address autocomplete (streets, neighborhoods, districts)
- ✅ Works for Finland, Sweden, Norway
- ✅ Returns formatted addresses
- ✅ Fast and reliable

## Costs
- Free tier: $0 (USD 200 monthly free credit)
- After free tier: ~$0.003 per place details request
- Most apps fit within free tier

## Troubleshooting

### "API key not valid for any of the requested APIs"
- Check that Places API is enabled in Google Cloud Console
- Verify API key is in `.env.local`
- Restart dev server

### "Tämä sivu ei voi ladata Google Mapsia oikein"
- Same as above - Places API not enabled

### Want to revert to city list?
- Just replace `LocationAutocomplete.tsx` with the previous version
- No other changes needed
