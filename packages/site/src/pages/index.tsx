import { useState } from 'react';
import styled from 'styled-components';

import {
  ConnectButton,
  InstallFlaskButton,
  ReconnectButton,
  GetEncryptionPublicKeyButton,
  GetEncryptionPublicKeySkipConfirmationButton,
  EncryptMessageButton,
  DecryptMessageButton,
  CreateEncryptedRequestMockButton,
  Card,
} from '../components';
import { defaultSnapOrigin } from '../config';
import {
  useMetaMask,
  useInvokeSnap,
  useMetaMaskContext,
  useRequestSnap,
} from '../hooks';
import { isLocalSnap, shouldDisplayReconnectButton } from '../utils';
import { ecEncrypt } from '../utils/ec-utils';
import { createEncryptedRequestMockStorage } from '../utils/encrypted-request-mock';

const formatJsonPretty = (value: unknown) => JSON.stringify(value, null, 2);

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  margin-top: 7.6rem;
  margin-bottom: 7.6rem;
  ${({ theme }) => theme.mediaQueries.small} {
    padding-left: 2.4rem;
    padding-right: 2.4rem;
    margin-top: 2rem;
    margin-bottom: 2rem;
    width: auto;
  }
`;

const Heading = styled.h1`
  margin-top: 0;
  margin-bottom: 2.4rem;
  text-align: center;
`;

const Span = styled.span`
  color: ${(props) => props.theme.colors.primary?.default};
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.large};
  font-weight: 500;
  margin-top: 0;
  margin-bottom: 0;
  ${({ theme }) => theme.mediaQueries.small} {
    font-size: ${({ theme }) => theme.fontSizes.text};
  }
`;

const CardContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  max-width: 64.8rem;
  width: 100%;
  height: 100%;
  margin-top: 1.5rem;
`;

const Notice = styled.div`
  background-color: ${({ theme }) => theme.colors.background?.alternative};
  border: 1px solid ${({ theme }) => theme.colors.border?.default};
  color: ${({ theme }) => theme.colors.text?.alternative};
  border-radius: ${({ theme }) => theme.radii.default};
  padding: 2.4rem;
  margin-top: 2.4rem;
  max-width: 60rem;
  width: 100%;

  & > * {
    margin: 0;
  }
  ${({ theme }) => theme.mediaQueries.small} {
    margin-top: 1.2rem;
    padding: 1.6rem;
  }
`;

const ErrorMessage = styled.div`
  background-color: ${({ theme }) => theme.colors.error?.muted};
  border: 1px solid ${({ theme }) => theme.colors.error?.default};
  color: ${({ theme }) => theme.colors.error?.alternative};
  border-radius: ${({ theme }) => theme.radii.default};
  padding: 2.4rem;
  margin-bottom: 2.4rem;
  margin-top: 2.4rem;
  max-width: 60rem;
  width: 100%;
  ${({ theme }) => theme.mediaQueries.small} {
    padding: 1.6rem;
    margin-bottom: 1.2rem;
    margin-top: 1.2rem;
    max-width: 100%;
  }
`;

const PublicKeyBlock = styled.code`
  display: block;
  margin-top: 1.6rem;
  padding: 1rem;
  word-break: break-all;
  background-color: ${({ theme }) => theme.colors.background?.alternative};
  border: 1px solid ${({ theme }) => theme.colors.border?.default};
  border-radius: ${({ theme }) => theme.radii.default};
`;

const PublicKeyError = styled.div`
  margin-top: 1.6rem;
  padding: 1rem;
  word-break: break-word;
  color: ${({ theme }) => theme.colors.error?.alternative};
  background-color: ${({ theme }) => theme.colors.error?.muted};
  border: 1px solid ${({ theme }) => theme.colors.error?.default};
  border-radius: ${({ theme }) => theme.radii.default};
`;

const EncryptedBlock = styled.code`
  display: block;
  margin-top: 1.6rem;
  padding: 1rem;
  word-break: break-all;
  background-color: ${({ theme }) => theme.colors.background?.alternative};
  border: 1px solid ${({ theme }) => theme.colors.border?.default};
  border-radius: ${({ theme }) => theme.radii.default};
`;

const EncryptedRequestResultBox = styled.div`
  display: block;
  margin-top: 1.6rem;
  padding: 1.2rem;
  background-color: ${({ theme }) => theme.colors.background?.alternative};
  border: 1px solid ${({ theme }) => theme.colors.border?.default};
  border-radius: ${({ theme }) => theme.radii.default};
`;

const JsonSectionLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.small};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text?.alternative};
  margin-top: 1.2rem;
  margin-bottom: 0.4rem;

  &:first-of-type {
    margin-top: 0;
  }
`;

const JsonPre = styled.pre`
  margin: 0;
  padding: 1rem;
  font-size: ${({ theme }) => theme.fontSizes.small};
  font-family: ${({ theme }) => theme.fonts.code};
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 20rem;
  overflow: auto;
  background-color: ${({ theme }) => theme.colors.background?.default};
  border: 1px solid ${({ theme }) => theme.colors.border?.default};
  border-radius: ${({ theme }) => theme.radii.default};
`;

const RequestIdLine = styled.code`
  display: block;
  padding: 0.6rem 1rem;
  font-size: ${({ theme }) => theme.fontSizes.small};
  word-break: break-all;
  background-color: ${({ theme }) => theme.colors.background?.default};
  border: 1px solid ${({ theme }) => theme.colors.border?.default};
  border-radius: ${({ theme }) => theme.radii.default};
`;

const EncryptedError = styled.div`
  margin-top: 1.6rem;
  padding: 1rem;
  word-break: break-word;
  color: ${({ theme }) => theme.colors.error?.alternative};
  background-color: ${({ theme }) => theme.colors.error?.muted};
  border: 1px solid ${({ theme }) => theme.colors.error?.default};
  border-radius: ${({ theme }) => theme.radii.default};
`;

const Index = () => {
  const { error, provider } = useMetaMaskContext();
  const { isFlask, snapsDetected, installedSnap } = useMetaMask();
  const requestSnap = useRequestSnap();
  const invokeSnap = useInvokeSnap();
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [publicKeyError, setPublicKeyError] = useState<string | null>(null);
  const [encryptedMessage, setEncryptedMessage] = useState<string | null>(null);
  const [encryptedMessageError, setEncryptedMessageError] = useState<
    string | null
  >(null);
  const [decryptedMessage, setDecryptedMessage] = useState<string | null>(
    null,
  );
  const [decryptedMessageError, setDecryptedMessageError] = useState<
    string | null
  >(null);
  const [encryptedRequestResult, setEncryptedRequestResult] = useState<{
    requestId: string;
    paymentData: any;
    encryptedData: any;
  } | null>(null);
  const [encryptedRequestError, setEncryptedRequestError] = useState<
    string | null
  >(null);

  const isMetaMaskReady = isLocalSnap(defaultSnapOrigin)
    ? isFlask
    : snapsDetected;

  const applySnapPublicKeyResult = (result: unknown) => {
    setPublicKey(null);
    setPublicKeyError(null);
    setEncryptedMessage(null);
    setEncryptedMessageError(null);

    if (typeof result === 'string') {
      setPublicKey(result);
      return;
    }

    if (result && typeof result === 'object' && 'publicKey' in result) {
      setPublicKey(String((result as { publicKey: unknown }).publicKey));
      return;
    }

    if (result === true) {
      setPublicKeyError(
        'Le snap renvoie seulement `true` (confirmation OK). Rebuild/reconnect/re-installe le snap pour qu’il retourne la clé publique.',
      );
      return;
    }

    setPublicKey(null);
    setPublicKeyError('Réponse inattendue du snap.');
  };

  const handleGetEncryptionPublicKeyClick = async () => {
    const result = await invokeSnap({ method: 'getEncryptionPublicKey' });
    applySnapPublicKeyResult(result);
  };

  const handleGetEncryptionPublicKeySkipConfirmationClick = async () => {
    const result = await invokeSnap({
      method: 'getEncryptionPublicKeySkipConfirmation',
    });
    applySnapPublicKeyResult(result);
  };

  const handleEncryptMessageClick = async () => {
    setEncryptedMessage(null);
    setEncryptedMessageError(null);
    setDecryptedMessage(null);
    setDecryptedMessageError(null);

    if (!publicKey) {
      setEncryptedMessageError(
        'Public key manquante. Clique d’abord sur “Get Encryption Public Key”.',
      );
      return;
    }

    try {
      const encrypted = await ecEncrypt(
        publicKey,
        'hello this is request',
      );
      setEncryptedMessage(encrypted);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Erreur lors du chiffrement.';
      setEncryptedMessageError(message);
    }
  };

  const handleCreateEncryptedRequestMockClick = async () => {
    setEncryptedRequestResult(null);
    setEncryptedRequestError(null);

    if (!provider) {
      setEncryptedRequestError('MetaMask non disponible.');
      return;
    }

    try {
      const result = await createEncryptedRequestMockStorage(provider);
      setEncryptedRequestResult(result);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Erreur lors de la création de la Request.';
      setEncryptedRequestError(message);
    }
  };

  const handleDecryptMessageClick = async () => {
    setDecryptedMessage(null);
    setDecryptedMessageError(null);

    if (!encryptedMessage) {
      setDecryptedMessageError(
        'Aucun message chiffré. Chiffre d’abord un message.',
      );
      return;
    }

    try {
      const result = await invokeSnap({
        method: 'decryptMessage',
        params: { message: encryptedMessage },
      });

      if (typeof result === 'string') {
        setDecryptedMessage(result);
        return;
      }

      if (result && typeof result === 'object' && 'decrypted' in result) {
        setDecryptedMessage(String((result as any).decrypted));
        return;
      }

      if (result === true) {
        setDecryptedMessageError(
          'Le snap a renvoyé `true` au lieu du message déchiffré.',
        );
        return;
      }

      setDecryptedMessageError('Réponse inattendue du snap.');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Erreur lors du déchiffrement.';
      setDecryptedMessageError(message);
    }
  };

  return (
    <Container>
      <Heading>
        Welcome to <Span>template-snap</Span>
      </Heading>
      <Subtitle>
        Get started by editing <code>src/index.tsx</code>
      </Subtitle>
      <CardContainer>
        {error && (
          <ErrorMessage>
            <b>An error happened:</b> {error.message}
          </ErrorMessage>
        )}
        {!isMetaMaskReady && (
          <Card
            content={{
              title: 'Install',
              description:
                'Snaps is pre-release software only available in MetaMask Flask, a canary distribution for developers with access to upcoming features.',
              button: <InstallFlaskButton />,
            }}
            fullWidth
          />
        )}
        {!installedSnap && (
          <Card
            content={{
              title: 'Connect',
              description:
                'Get started by connecting to and installing the example snap.',
              button: (
                <ConnectButton
                  onClick={requestSnap}
                  disabled={!isMetaMaskReady}
                />
              ),
            }}
            disabled={!isMetaMaskReady}
          />
        )}
        {shouldDisplayReconnectButton(installedSnap) && (
          <Card
            content={{
              title: 'Reconnect',
              description:
                'While connected to a local running snap this button will always be displayed in order to update the snap if a change is made.',
              button: (
                <ReconnectButton
                  onClick={requestSnap}
                  disabled={!installedSnap}
                />
              ),
            }}
            disabled={!installedSnap}
          />
        )}
        <Card
          content={{
            title: 'Get Encryption Public Key',
            description: (
              <>
                Get the encryption public key from a specific address.
                {publicKey ? (
                  <PublicKeyBlock>{publicKey}</PublicKeyBlock>
                ) : null}
                {publicKeyError ? <PublicKeyError>{publicKeyError}</PublicKeyError> : null}
              </>
            ),
            button: (
              <GetEncryptionPublicKeyButton
                onClick={handleGetEncryptionPublicKeyClick}
                disabled={!installedSnap}
              />
            ),
          }}
          disabled={!installedSnap}
          fullWidth={
            isMetaMaskReady &&
            Boolean(installedSnap) &&
            !shouldDisplayReconnectButton(installedSnap)
          }
        />

        <Card
          content={{
            title: 'Get public key (skip confirmation)',
            description: (
              <>
                Same encryption public key as above, without MetaMask
                confirmation dialog.
                {publicKey ? (
                  <PublicKeyBlock>{publicKey}</PublicKeyBlock>
                ) : null}
                {publicKeyError ? <PublicKeyError>{publicKeyError}</PublicKeyError> : null}
              </>
            ),
            button: (
              <GetEncryptionPublicKeySkipConfirmationButton
                onClick={handleGetEncryptionPublicKeySkipConfirmationClick}
                disabled={!installedSnap}
              />
            ),
          }}
          disabled={!installedSnap}
          fullWidth={
            isMetaMaskReady &&
            Boolean(installedSnap) &&
            !shouldDisplayReconnectButton(installedSnap)
          }
        />

        <Card
          content={{
            title: 'Encrypt message',
            description: (
              <>
                Chiffre le message `hello this is request` avec la `publicKey`.
                {encryptedMessage ? (
                  <EncryptedBlock>{encryptedMessage}</EncryptedBlock>
                ) : null}
                {encryptedMessageError ? (
                  <EncryptedError>{encryptedMessageError}</EncryptedError>
                ) : null}
              </>
            ),
            button: (
              <EncryptMessageButton
                onClick={handleEncryptMessageClick}
                disabled={!installedSnap || !publicKey}
              />
            ),
          }}
          disabled={!installedSnap}
          fullWidth={
            isMetaMaskReady &&
            Boolean(installedSnap) &&
            !shouldDisplayReconnectButton(installedSnap)
          }
        />

        <Card
          content={{
            title: 'Decrypt on snap',
            description: (
              <>
                Envoie le message chiffré au snap pour le déchiffrer.
                {decryptedMessage ? (
                  <EncryptedBlock>{decryptedMessage}</EncryptedBlock>
                ) : null}
                {decryptedMessageError ? (
                  <EncryptedError>{decryptedMessageError}</EncryptedError>
                ) : null}
              </>
            ),
            button: (
              <DecryptMessageButton
                onClick={handleDecryptMessageClick}
                disabled={!installedSnap || !encryptedMessage}
              />
            ),
          }}
          disabled={!installedSnap}
          fullWidth={
            isMetaMaskReady &&
            Boolean(installedSnap) &&
            !shouldDisplayReconnectButton(installedSnap)
          }
        />

        <Card
          content={{
            title: 'Request Network (chiffrée, mock storage)',
            description: (
              <>
                Crée une Request chiffrée avec{' '}
                <code>@requestnetwork/request-light.js</code> (en mémoire, sans
                persistance nœud), sans réseau de paiement ni
                détection. Le compte MetaMask actuel est le payee ; signature
                via <code>web3-signature</code>.
                {encryptedRequestResult ? (
                  <EncryptedRequestResultBox>
                    <JsonSectionLabel>requestId</JsonSectionLabel>
                    <RequestIdLine>
                      {encryptedRequestResult.requestId}
                    </RequestIdLine>
                    <JsonSectionLabel>Payment data</JsonSectionLabel>
                    <JsonPre>{formatJsonPretty(encryptedRequestResult.paymentData)}</JsonPre>
                    <JsonSectionLabel>encryptedRequestData</JsonSectionLabel>
                    <JsonPre>
                      {formatJsonPretty(
                        encryptedRequestResult.encryptedData,
                      )}
                    </JsonPre>
                  </EncryptedRequestResultBox>
                ) : null}
                {encryptedRequestError ? (
                  <EncryptedError>{encryptedRequestError}</EncryptedError>
                ) : null}
              </>
            ),
            button: (
              <CreateEncryptedRequestMockButton
                onClick={handleCreateEncryptedRequestMockClick}
                disabled={!provider}
              />
            ),
          }}
          disabled={!provider}
          fullWidth
        />

        <Notice>
          <p>
            Please note that the <b>snap.manifest.json</b> and{' '}
            <b>package.json</b> must be located in the server root directory and
            the bundle must be hosted at the location specified by the location
            field.
          </p>
        </Notice>
      </CardContainer>
    </Container>
  );
};

export default Index;
