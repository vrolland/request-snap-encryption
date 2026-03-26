import type { MetaMaskInpageProvider } from '@metamask/providers';
// import { EthereumPrivateKeyDecryptionProvider } from '@requestnetwork/epk-decryption';
import {
  RequestNetwork,
  Types,
  Utils,
} from '@requestnetwork/request-light.js';
// import { Web3SignatureProvider } from '@requestnetwork/web3-signature';
import { EthereumPrivateKeySignatureProvider } from '@requestnetwork/epk-signature';

import { CHECKOUT_PAGE_CONTENT_DATA } from '../page-data/checkout-page-content-data';

/**
 * Clé publique de démo (ECIES), alignée sur les exemples officiels Request Network.
 * Ne pas utiliser en production.
 */
// const DEMO_DECRYPTION = {
  // for 0xf17f52151EbEF6C7334FAD080c5704D77216b732
//   key: '0xae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f',
//   method: Types.Encryption.METHOD.ECIES,
// } as const;

 	

const DEMO_ENCRYPTION_PUBLIC = {
  // for 0xf17f52151EbEF6C7334FAD080c5704D77216b732
  key: '0x02ce7edc292d7b747fab2f23584bbafaffde5c8ff17cf689969614441e0527b900',
  method: Types.Encryption.METHOD.ECIES,
} as const;

const DEMO_PAYER = '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6';

/** Réseau de paiement ERC20 fee proxy (Sepolia), aligné sur request-light-js. */
const PAYMENT_NETWORK: Types.Payment.PaymentNetworkCreateParameters = {
  id: Types.Extension.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
  parameters: {
    paymentAddress: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
    paymentNetworkName: 'sepolia',
    feeAddress: '0x0000000000000000000000000000000000000000',
    feeAmount: '0',
  },
};

/**
 * Crée une Request chiffrée via @requestnetwork/request-light.js (données en mémoire,
 * sans persistance nœud), avec réseau de paiement ERC20 fee proxy sur Sepolia.
 *
 * @param ethereumProvider - Provider EIP-1193 (MetaMask).
 * @param options.payerEncryptionPublicKey - Clé publique ECIES du payeur (ex. snap), si le client a choisi de la partager au marchand.
 * @returns Identifiant et état de la Request créée en mémoire.
 */
export async function createEncryptedRequestMockStorage(
  ethereumProvider: MetaMaskInpageProvider,
  options?: {
    payerEncryptionPublicKey?: string;
  },
): Promise<{
  requestId: string;
  paymentData: any;
  encryptedData: any;
}> {
  const accounts = (await ethereumProvider.request({
    method: 'eth_requestAccounts',
  })) as string[] | undefined;

  const address = accounts?.[0];
  if (!address) {
    throw new Error('Aucun compte Ethereum connecté.');
  }

  // const payeeAddress = address.toLowerCase();
  const payeeAddress = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57"
   	
  // const signatureProvider = new Web3SignatureProvider(ethereumProvider);
  const signatureProvider = new EthereumPrivateKeySignatureProvider({
    method: Types.Signature.METHOD.ECDSA,
    // for 0x627306090abaB3A6e1400e9345bC60c78a8BEf57
    privateKey: '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
  });

  // const decryptionProvider = new EthereumPrivateKeyDecryptionProvider(
  //   DEMO_DECRYPTION,
  // );

  const requestNetwork = new RequestNetwork({
    signatureProvider,
    // decryptionProvider,
  });

  const signer: Types.Identity.IIdentity = {
    type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
    value: payeeAddress,
  };

  const payerPk = options?.payerEncryptionPublicKey?.trim();
  const encryptionParams = [
    DEMO_ENCRYPTION_PUBLIC,
    ...(payerPk
      ? [
          {
            key: payerPk.startsWith('0x') ? payerPk : `0x${payerPk}`,
            method: Types.Encryption.METHOD.ECIES,
          },
        ]
      : []),
  ];

  const request = await requestNetwork._createEncryptedRequest(
    {
      paymentNetwork: PAYMENT_NETWORK,
      requestInfo: {
        currency: 'FAU-sepolia',
        expectedAmount: '100000000000',
        payee: signer,
        payer: {
          type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
          value: DEMO_PAYER,
        },
        timestamp: Utils.getCurrentTimestampInSecond(),
      },
      signer,
      contentData: CHECKOUT_PAGE_CONTENT_DATA,
      disablePaymentDetection: true,
    },
    encryptionParams,
  );
  console.log("request:", request);
  const requestApiData = request.getDataForAPI()

  console.log("requestApiData:", requestApiData);
  return {
    requestId: requestApiData.requestId,
    paymentData: requestApiData.paymentData,
    encryptedData: requestApiData.encryptedData,
    // requestId: request.requestId,
    // state: requestData?.state ?? Types.RequestLogic.STATE.CREATED,
  };
}
