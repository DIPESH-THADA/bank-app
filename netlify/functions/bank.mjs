import { getStore } from '@netlify/blobs';
import { handleBankRequest } from '../../server/netlify-adapter.mjs';

export default async (request, context) => {
  try {
    return await handleBankRequest(
      request,
      context,
      getStore({ name: 'rbb-banking-demo-v1', consistency: 'strong' }),
    );
  } catch (error) {
    console.error('Bank API storage or runtime failure:', error.name);
    return Response.json(
      { message: 'The demo API is temporarily unavailable. Please try again.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
};
export const config = { path: '/api/*' };
