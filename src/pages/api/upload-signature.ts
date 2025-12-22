
import { NextApiRequest, NextApiResponse } from 'next';
import { getStorage } from 'firebase-admin/storage';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin'; // Updated import
import { v4 as uuidv4 } from 'uuid';

export const config = {
  api: {
    // It's crucial to set bodyParser to false when dealing with raw data streams or buffers.
    bodyParser: false,
  },
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  try {
    // Ensure Firebase Admin is initialized before using any admin services.
    initializeFirebaseAdmin();
    const bucket = getStorage().bucket();

    // Manually parse the request body from buffer chunks.
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    const body = Buffer.concat(chunks).toString('utf8');
    const { signature, checkId } = JSON.parse(body);

    if (!signature || !checkId) {
        return res.status(400).json({ message: 'Signature data and checkId are required.' });
    }

    // Convert the data URI to a Buffer.
    const base64Data = signature.replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    const fileName = `signatures/${checkId}/${uuidv4()}.png`;
    const file = bucket.file(fileName);

    // Save the file to the bucket and make it public.
    await file.save(buffer, {
      metadata: {
        contentType: 'image/png',
      },
      public: true, // This is crucial for getting a public URL
    });

    const publicUrl = file.publicUrl();

    // Return the public URL of the uploaded signature.
    return res.status(200).json({ signatureUrl: publicUrl });

  } catch (error: any) {
    console.error('Error uploading signature:', error);

    let message = 'خطای سرور در آپلود امضا.';
    // Provide a more specific error message if it's a permission issue.
    if (error.code === 403) {
        message = 'خطای دسترسی (403): سرویس‌اکانت برنامه اجازه نوشتن در Storage را ندارد. لطفا از کنسول Google Cloud، نقش Storage Object Admin را به آن اضافه کنید.';
    }

    return res.status(500).json({ message: message, error: error.message });
  }
}

export default handler;
