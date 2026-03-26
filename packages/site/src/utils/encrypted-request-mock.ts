import type { MetaMaskInpageProvider } from '@metamask/providers';
// import { EthereumPrivateKeyDecryptionProvider } from '@requestnetwork/epk-decryption';
import {
  RequestNetwork,
  Types,
  Utils,
} from '@requestnetwork/request-light.js';
import { Web3SignatureProvider } from '@requestnetwork/web3-signature';

import { CHECKOUT_PAGE_CONTENT_DATA } from '../page-data/checkout-page-content-data';

/**
 * Clé publique de démo (ECIES), alignée sur les exemples officiels Request Network.
 * Ne pas utiliser en production.
 */
// const DEMO_DECRYPTION = {
//   key: '0x4025da5692759add08f98f4b056c41c71916a671cedc7584a80d73adc7fb43c0',
//   method: Types.Encryption.METHOD.ECIES,
// } as const;

const DEMO_ENCRYPTION_PUBLIC = {
  key: 'cf4a1d0bbef8bf0e3fa479a9def565af1b22ea6266294061bfb430701b54a83699e3d47bf52e9f0224dcc29a02721810f1f624f1f70ea3cc5f1fb752cfed379d',
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
 * @returns Identifiant et état de la Request créée en mémoire.
 */
export async function createEncryptedRequestMockStorage(
  ethereumProvider: MetaMaskInpageProvider,
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

  const payeeAddress = address.toLowerCase();

  const signatureProvider = new Web3SignatureProvider(ethereumProvider);
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
    [DEMO_ENCRYPTION_PUBLIC],
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
