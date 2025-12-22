
import { NextApiRequest, NextApiResponse } from 'next';
import { getStorage } from 'firebase-admin/storage';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';

// Note: We are NOT disabling bodyParser anymore. 
// Next.js can handle JSON body parsing automatically.

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  try {
    // The request body is already parsed by Next.js
    const { signature, checkId } = req.body;

    if (!signature || !checkId) {
      return res.status(400).json({ message: 'Signature data and checkId are required.' });
    }

    // Ensure Firebase Admin is initialized before using any admin services.
    initializeFirebaseAdmin();
    const bucket = getStorage().bucket();

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
      public: true,
    });

    const publicUrl = file.publicUrl();

    // Return the public URL of the uploaded signature.
    return res.status(200).json({ signatureUrl: publicUrl });

  } catch (error: any) {
    console.error('Error uploading signature:', error);

    let message = 'خطای سرور در آپلود امضا.';
    if (error.code === 'storage/unauthorized' || error.code === 403) {
      message = 'خطای دسترسی (403): اعتبارنامه سرویس شما اجازه آپلود در Storage را ندارد.';
    } else if (error instanceof SyntaxError) {
      message = 'خطای解析 (Parsing Error): فرمت درخواست ارسالی صحیح نیست.';
    }

    return res.status(500).json({ message: message, error: error.message });
  }
}

export default handler;
