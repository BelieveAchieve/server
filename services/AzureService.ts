import { DefaultAzureCredential } from '@azure/identity';
import { BlobServiceClient } from '@azure/storage-blob';
import config from '../config';

const whiteboardStorageAccount = config.whiteboardStorageAccountName;
const defaultAzureCredential = new DefaultAzureCredential();
const blobServiceClient = new BlobServiceClient(
  `https://${whiteboardStorageAccount}.blob.core.windows.net`,
  defaultAzureCredential
);

// a helper method used to read a Node.js readable stream into a Buffer
async function streamToBuffer(readableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on('data', data => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on('error', reject);
  });
}

export const getBlob = async ({
  containerName,
  blobName
}: {
  containerName: string;
  blobName: string;
}): Promise<string> => {
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blobClient = containerClient.getBlobClient(blobName);
  const downloadBlockBlobResponse = await blobClient.download();
  const blobContent = (
    await streamToBuffer(downloadBlockBlobResponse.readableStreamBody)
  ).toString();
  return blobContent;
};

export const uploadBlob = async ({
  containerName,
  blobName,
  content
}: {
  containerName: string;
  blobName: string;
  content: string;
}): Promise<void> => {
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.upload(content, content.length);
};
