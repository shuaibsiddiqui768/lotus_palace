# Cloudinary Setup Instructions

## Prerequisites
- You have already added the environment variables to `.env.local`
- The `next-cloudinary` package is installed

## Steps to Enable Image Uploads

### 1. Create an Upload Preset in Cloudinary

1. Go to [Cloudinary Dashboard](https://cloudinary.com/console)
2. Navigate to **Settings** → **Upload**
3. Scroll down to **Upload presets** section
4. Click **Add upload preset**
5. Configure:
   - **Name**: `foodhub_upload`
   - **Signing Mode**: Unsigned
   - **Folder**: `foodhub/images` (optional, for organization)
   - Click **Save**

### 2. Environment Variables
Your `.env.local` should already have:
```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dsb0vh0vu
CLOUDINARY_API_KEY=2fDdzRK-wjY1DeuflFjcZ5qNBr4
CLOUDINARY_API_SECRET=532556131213214
```

### 3. Verify the Upload Works

1. Start your development server: `npm run dev`
2. Navigate to the Admin Panel → Manage Food
3. Click "Click to upload image" button
4. Select an image file from your computer
5. The image will be uploaded to Cloudinary and a preview will appear
6. The Cloudinary URL will be stored when you submit the food form

## Troubleshooting

- **Upload fails**: Ensure the upload preset `foodhub_upload` exists and is set to "Unsigned"
- **Image not showing**: Check that the cloud name is correct in `.env.local`
- **CORS errors**: Make sure your domain is added to Cloudinary's allowed domains if needed

## Security Note

- The unsigned upload preset allows uploads from your frontend
- You can restrict uploads by file size and type in the preset settings
- Consider adding a signed upload method for production environments
