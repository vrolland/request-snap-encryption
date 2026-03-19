import type { OnRpcRequestHandler } from '@metamask/snaps-sdk';
import { Box, Text, Bold } from '@metamask/snaps-sdk/jsx';

import { getBIP44AddressKeyDeriver } from "@metamask/key-tree";


/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns The response value returned to the caller.
 * @throws If the request method is not valid for this snap.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  switch (request.method) {
    case 'hello':
      return snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: (
            <Box>
              <Text>
                Hello, <Bold>{origin}</Bold>!
              </Text>
              <Text>
                This custom confirmation is just for display purposes.
              </Text>
              <Text>
                But you can edit the snap source code to make it do something,
                if you want to!
              </Text>
            </Box>
          ),
        },
      });
    case 'getEncryptionPublicKey':
      const requestMetaMaskNode = await snap.request({
        method: "snap_getBip44Entropy",
        params: {
          coinType: 666999666,
        },
      });

      // Next, create an address key deriver function for a coin_type 666999666
      // node. In this case, its path is: m/44'/666999666'/0'/0/address_index
      const deriveAddress = await getBIP44AddressKeyDeriver(requestMetaMaskNode);

      // These are BIP-44 nodes containing the extended private keys for the
      // respective derivation paths.

      // m/44'/666999666'/0'/0/0
      const addressKey0 = await deriveAddress(0);

      // // m/44'/666999666'/0'/0/1
      // const addressKey1 = await deriveAddress(1);

      // Affiche un écran de confirmation, puis retourne la clé publique
      // directement au site (via la valeur résolue par `wallet_invokeSnap`).
      const confirmation = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: (
            <Box>
              <Text>
                Hello, <Bold>{origin}</Bold>!
              </Text>
              <Text>
                Request for public key from this address: {addressKey0.address}
              </Text>
              <Text>
                The public key: {addressKey0.publicKey}
              </Text>
            </Box>
          ),
        },
      });

      if (confirmation !== true) {
        throw new Error('User rejected the request.');
      }

      return addressKey0.publicKey;
    default:
      throw new Error('Method not found.');
  }
};
