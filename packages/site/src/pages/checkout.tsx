import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import { InstallFlaskButton } from '../components';
import { defaultSnapOrigin } from '../config';
import {
  useInvokeSnap,
  useMetaMask,
  useMetaMaskContext,
  useRequestSnap,
} from '../hooks';
import { createSecurePaymentLight } from '../utils/secure-payment-api';
import { createEncryptedRequestMockStorage } from '../utils/encrypted-request-mock';
import { isLocalSnap } from '../utils';

const Page = styled.main`
  flex: 1;
  width: 100%;
  max-width: 96rem;
  margin: 0 auto;
  padding: 2.4rem 2.4rem 4.8rem;
  box-sizing: border-box;

  ${({ theme }) => theme.mediaQueries.small} {
    padding: 1.6rem 1.6rem 3.2rem;
  }
`;

const Breadcrumb = styled.p`
  margin: 0 0 0.8rem;
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.text?.alternative};
`;

const Title = styled.h1`
  margin: 0 0 2.4rem;
  font-size: 2.8rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text?.default};

  ${({ theme }) => theme.mediaQueries.small} {
    font-size: 2.2rem;
    margin-bottom: 1.6rem;
  }
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr 38rem;
  gap: 3.2rem;
  align-items: start;

  ${({ theme }) => theme.mediaQueries.small} {
    grid-template-columns: 1fr;
    gap: 2.4rem;
  }
`;

const Panel = styled.section`
  background: ${({ theme }) => theme.colors.card?.default};
  border: 1px solid ${({ theme }) => theme.colors.border?.default};
  border-radius: ${({ theme }) => theme.radii.default};
  box-shadow: ${({ theme }) => theme.shadows.default};
  padding: 2rem;
`;

const PanelTitle = styled.h2`
  margin: 0 0 1.6rem;
  font-size: ${({ theme }) => theme.fontSizes.large};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text?.default};
`;

const InfoBlock = styled.div`
  margin-bottom: 1.6rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.small};
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${({ theme }) => theme.colors.text?.alternative};
  margin-bottom: 0.4rem;
`;

const InfoValue = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.text};
  color: ${({ theme }) => theme.colors.text?.default};
  line-height: 1.5;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${({ theme }) => theme.colors.border?.default};
  margin: 1.6rem 0;
`;

const LineItem = styled.div`
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 1.2rem;
  align-items: start;
  padding: 1.2rem 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border?.default};

  &:first-of-type {
    padding-top: 0;
  }

  &:last-of-type {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const ItemName = styled.div`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text?.default};
`;

const ItemMeta = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.text?.alternative};
  margin-top: 0.2rem;
`;

const ItemQty = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.text?.alternative};
  text-align: right;
`;

const ItemPrice = styled.div`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text?.default};
  text-align: right;
  min-width: 7rem;
`;

const Totals = styled.div`
  margin-top: 1.6rem;
  padding-top: 1.6rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border?.default};
`;

const TotalRow = styled.div<{ $emphasis?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.8rem;
  font-size: ${({ $emphasis, theme }) =>
    $emphasis ? theme.fontSizes.large : theme.fontSizes.text};
  font-weight: ${({ $emphasis }) => ($emphasis ? 600 : 400)};
  color: ${({ theme }) => theme.colors.text?.default};

  &:last-child {
    margin-bottom: 0;
  }
`;

const PaymentZone = styled.div`
  margin-top: 1.6rem;
  padding: 1.6rem;
  border: 1px dashed ${({ theme }) => theme.colors.border?.default};
  border-radius: ${({ theme }) => theme.radii.default};
  background: ${({ theme }) => theme.colors.background?.alternative};
  text-align: left;
`;

const PaymentZoneTitle = styled.h3`
  margin: 0 0 0.8rem;
  font-size: ${({ theme }) => theme.fontSizes.text};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text?.default};
`;

const PaymentHelp = styled.p`
  margin: 0 0 1.2rem;
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.text?.alternative};
  line-height: 1.5;
`;

const PaymentIntro = styled(PaymentHelp)`
  margin-bottom: 1.6rem;
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
`;

const PrimaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 1.4rem;
  font-size: ${({ theme }) => theme.fontSizes.small};
  font-weight: bold;
  border-radius: ${({ theme }) => theme.radii.button};
  border: 1px solid ${({ theme }) => theme.colors.background?.inverse};
  background-color: ${({ theme }) => theme.colors.background?.inverse};
  color: ${({ theme }) => theme.colors.text?.inverse};
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover:not(:disabled) {
    background-color: transparent;
    color: ${({ theme }) => theme.colors.text?.default};
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  ${({ theme }) => theme.mediaQueries.small} {
    width: 100%;
  }
`;

const SecondaryButton = styled(PrimaryButton)`
  background-color: transparent;
  color: ${({ theme }) => theme.colors.text?.default};

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.background?.inverse};
    color: ${({ theme }) => theme.colors.text?.inverse};
  }
`;

const PaymentError = styled.div`
  margin-bottom: 1rem;
  padding: 1rem;
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.error?.alternative};
  background-color: ${({ theme }) => theme.colors.error?.muted};
  border: 1px solid ${({ theme }) => theme.colors.error?.default};
  border-radius: ${({ theme }) => theme.radii.default};
`;

const FlaskWrap = styled.div`
  margin-top: 1rem;
`;

const CheckboxRow = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  margin: 1.2rem 0 0;
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.text?.default};
  line-height: 1.45;
`;

const CheckboxInput = styled.input`
  margin-top: 0.35rem;
  flex-shrink: 0;
  width: 1.6rem;
  height: 1.6rem;
  cursor: pointer;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: rgba(0, 0, 0, 0.5);
  box-sizing: border-box;
`;

const ModalDialog = styled.div`
  position: relative;
  width: 100%;
  max-width: 44rem;
  max-height: min(90vh, 640px);
  overflow: auto;
  padding: 2rem;
  border-radius: ${({ theme }) => theme.radii.default};
  background: ${({ theme }) => theme.colors.card?.default};
  border: 1px solid ${({ theme }) => theme.colors.border?.default};
  box-shadow: ${({ theme }) => theme.shadows.default};
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.6rem;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.large};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text?.default};
`;

const ModalClose = styled.button`
  flex-shrink: 0;
  width: 3.2rem;
  height: 3.2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: ${({ theme }) => theme.radii.button};
  background: ${({ theme }) => theme.colors.background?.alternative};
  color: ${({ theme }) => theme.colors.text?.default};
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.border?.default};
  }
`;

const PanelStack = styled(Panel)`
  margin-top: 2.4rem;
`;

const OrderRef = styled.p`
  margin: 0 0 1.6rem;
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.text?.alternative};
`;

/**
 * Page checkout marchande + zone paiement Request Network (snap).
 * Route Gatsby : `/checkout`
 */
const CheckoutPage = () => {
  const { error, provider } = useMetaMaskContext();
  const { isFlask, snapsDetected, installedSnap, getSnap } = useMetaMask();
  const requestSnap = useRequestSnap();
  const invokeSnap = useInvokeSnap();

  const [keyShareError, setKeyShareError] = useState<string | null>(null);
  const [keyShareBusy, setKeyShareBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  /** Toujours ouvrir sur « partager la clé » ; autres vues si besoin d’installer Flask / le snap */
  const [modalStep, setModalStep] = useState<
    'shareKey' | 'needFlask' | 'needSnap'
  >('shareKey');
  const [shareEncryptionKeyWithMerchant, setShareEncryptionKeyWithMerchant] =
    useState(false);
  /** Création request-light + POST /v2/secure-payments */
  const [securePaymentError, setSecurePaymentError] = useState<string | null>(
    null,
  );
  const [securePaymentBusy, setSecurePaymentBusy] = useState(false);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setModalStep('shareKey');
    setKeyShareError(null);
    setShareEncryptionKeyWithMerchant(false);
    setSecurePaymentError(null);
  }, []);

  const openPaymentModal = useCallback(() => {
    setModalStep('shareKey');
    setKeyShareError(null);
    setSecurePaymentError(null);
    setShareEncryptionKeyWithMerchant(false);
    setModalOpen(true);
    void getSnap();
  }, [getSnap]);

  const runSecurePaymentFlow = useCallback(
    async (payerEncryptionPublicKey?: string) => {
      if (!provider) {
        throw new Error(
          'Wallet introuvable. Utilisez un navigateur avec MetaMask.',
        );
      }
      const { requestId, paymentData, encryptedData } =
        await createEncryptedRequestMockStorage(provider, {
          payerEncryptionPublicKey,
        });
      const { securePaymentUrl } = await createSecurePaymentLight({
        requests: [{ requestId, paymentData, encryptedData }],
      });
      if (typeof window !== 'undefined') {
        window.location.assign(securePaymentUrl);
      }
    },
    [provider],
  );

  const startSecurePaymentCheckout = useCallback(async () => {
    setSecurePaymentError(null);
    setSecurePaymentBusy(true);
    try {
      await runSecurePaymentFlow();
    } catch (e) {
      setSecurePaymentError(
        e instanceof Error ? e.message : String(e),
      );
    } finally {
      setSecurePaymentBusy(false);
    }
  }, [runSecurePaymentFlow]);

  useEffect(() => {
    if (!modalOpen) {
      return undefined;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [modalOpen, closeModal]);

  const isMetaMaskReady = isLocalSnap(defaultSnapOrigin)
    ? isFlask
    : snapsDetected;

  const handleInstallSnapFromModal = async () => {
    setKeyShareError(null);
    if (!isMetaMaskReady || installedSnap) {
      return;
    }
    await requestSnap();
    await getSnap();
    setModalStep('shareKey');
  };

  const handleSendEncryptionKeyToMerchant = async () => {
    setKeyShareError(null);
    setKeyShareBusy(true);
    try {
      const result = await invokeSnap({ method: 'getEncryptionPublicKey' });
      let payerPk: string | undefined;
      if (typeof result === 'string' && result.length > 0) {
        payerPk = result;
      } else if (result && typeof result === 'object' && 'publicKey' in result) {
        const pk = String((result as { publicKey: unknown }).publicKey);
        if (pk) {
          payerPk = pk;
        }
      }
      if (!payerPk) {
        setKeyShareError(
          'Impossible de récupérer la clé publique. Vérifiez que le snap est à jour et réessayez.',
        );
        return;
      }
      await runSecurePaymentFlow(payerPk);
    } catch (e: unknown) {
      setKeyShareError(
        e instanceof Error ? e.message : 'Erreur lors de la demande de clé.',
      );
    } finally {
      setKeyShareBusy(false);
    }
  };

  const handleCancelModal = () => {
    setKeyShareError(null);
    closeModal();
  };

  const handleProceedToPayment = () => {
    setKeyShareError(null);
    setSecurePaymentError(null);
    if (!shareEncryptionKeyWithMerchant) {
      void startSecurePaymentCheckout();
      return;
    }
    if (!isMetaMaskReady) {
      setModalStep('needFlask');
      return;
    }
    if (!installedSnap) {
      setModalStep('needSnap');
      return;
    }
    void handleSendEncryptionKeyToMerchant();
  };

  return (
    <Page>
      <Breadcrumb>Panier · Paiement · Confirmation</Breadcrumb>
      <Title>Finaliser la commande</Title>

      <Layout>
        <div>
          <Panel>
            <PanelTitle>Livraison</PanelTitle>
            <InfoBlock>
              <InfoLabel>Adresse</InfoLabel>
              <InfoValue>
                Marie Dupont
                <br />
                12 rue du Commerce
                <br />
                75011 Paris, France
              </InfoValue>
            </InfoBlock>
            <Divider />
            <InfoBlock>
              <InfoLabel>Mode de livraison</InfoLabel>
              <InfoValue>Colissimo — 3 à 5 jours ouvrés</InfoValue>
            </InfoBlock>
          </Panel>

          <PanelStack>
            <PanelTitle>Facturation</PanelTitle>
            <InfoBlock>
              <InfoLabel>Adresse de facturation</InfoLabel>
              <InfoValue>
                Identique à l’adresse de livraison
              </InfoValue>
            </InfoBlock>
          </PanelStack>
        </div>

        <div>
          <Panel>
            <PanelTitle>Récapitulatif</PanelTitle>
            <OrderRef>Commande n° REQ-2026-1847</OrderRef>

            <LineItem>
              <div>
                <ItemName>T-shirt Request Network</ItemName>
                <ItemMeta>Taille M · Blanc</ItemMeta>
              </div>
              <ItemQty>× 1</ItemQty>
              <ItemPrice>24,90 €</ItemPrice>
            </LineItem>
            <LineItem>
              <div>
                <ItemName>Autocollants branding</ItemName>
                <ItemMeta>Lot de 5</ItemMeta>
              </div>
              <ItemQty>× 2</ItemQty>
              <ItemPrice>9,80 €</ItemPrice>
            </LineItem>
            <LineItem>
              <div>
                <ItemName>Frais de port</ItemName>
                <ItemMeta>Colissimo</ItemMeta>
              </div>
              <ItemQty>—</ItemQty>
              <ItemPrice>4,50 €</ItemPrice>
            </LineItem>

            <Totals>
              <TotalRow>
                <span>Sous-total</span>
                <span>44,60 €</span>
              </TotalRow>
              <TotalRow>
                <span>TVA (20 %)</span>
                <span>8,92 €</span>
              </TotalRow>
              <TotalRow $emphasis>
                <span>Total TTC</span>
                <span>53,52 €</span>
              </TotalRow>
            </Totals>

            <PaymentZone>
              <PaymentZoneTitle>Request Network</PaymentZoneTitle>
              <PaymentIntro>
                Paiement Request Network : une requête chiffrée est créée
                puis enregistrée via l’API (v2 secure-payments). Configurez
                GATSBY_REQUEST_API_CLIENT_ID (ou GATSBY_REQUEST_API_KEY) au
                build. Vous êtes ensuite redirigé vers la page de paiement
                sécurisée.
              </PaymentIntro>
              <PrimaryButton type="button" onClick={openPaymentModal}>
                Pay with Request Network
              </PrimaryButton>
            </PaymentZone>

            {modalOpen ? (
              <ModalOverlay
                role="presentation"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    closeModal();
                  }
                }}
              >
                <ModalDialog
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="checkout-rn-modal-title"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <ModalHeader>
                    <ModalTitle id="checkout-rn-modal-title">
                      Request Network
                    </ModalTitle>
                    <ModalClose
                      type="button"
                      aria-label="Fermer"
                      onClick={closeModal}
                    >
                      ×
                    </ModalClose>
                  </ModalHeader>

                  {error ? (
                    <PaymentError>
                      <strong>Erreur MetaMask :</strong> {error.message}
                    </PaymentError>
                  ) : null}

                  {modalStep === 'shareKey' ? (
                    <>
                      <PaymentHelp>
                        Cochez l’option ci-dessous si vous souhaitez que MetaMask
                        vous demande votre <strong>clé publique d’encryption</strong>{' '}
                        avant le paiement. Sinon, vous serez redirigé directement
                        vers la page de paiement.
                      </PaymentHelp>
                      <CheckboxRow htmlFor="checkout-share-encryption-key">
                        <CheckboxInput
                          id="checkout-share-encryption-key"
                          type="checkbox"
                          checked={shareEncryptionKeyWithMerchant}
                          onChange={(e) =>
                            setShareEncryptionKeyWithMerchant(e.target.checked)
                          }
                          disabled={keyShareBusy}
                        />
                        <span>Envoyer la clé d’encryption au marchand</span>
                      </CheckboxRow>
                      <ActionRow>
                        <PrimaryButton
                          type="button"
                          disabled={keyShareBusy || securePaymentBusy}
                          onClick={handleProceedToPayment}
                        >
                          {keyShareBusy || securePaymentBusy
                            ? 'Préparation du paiement…'
                            : 'Proceed to payment'}
                        </PrimaryButton>
                        <SecondaryButton
                          type="button"
                          disabled={keyShareBusy || securePaymentBusy}
                          onClick={handleCancelModal}
                        >
                          Cancel
                        </SecondaryButton>
                      </ActionRow>
                      {keyShareError ? (
                        <PaymentError>{keyShareError}</PaymentError>
                      ) : null}
                      {securePaymentError ? (
                        <PaymentError>{securePaymentError}</PaymentError>
                      ) : null}
                    </>
                  ) : null}

                  {modalStep === 'needFlask' ? (
                    <>
                      <PaymentHelp>
                        Les Snaps nécessitent <strong>MetaMask Flask</strong>{' '}
                        (ou un environnement compatible). Installez-le, puis
                        réessayez d’envoyer votre clé.
                      </PaymentHelp>
                      <FlaskWrap>
                        <InstallFlaskButton />
                      </FlaskWrap>
                      <ActionRow>
                        <SecondaryButton
                          type="button"
                          onClick={() => setModalStep('shareKey')}
                        >
                          Retour
                        </SecondaryButton>
                      </ActionRow>
                    </>
                  ) : null}

                  {modalStep === 'needSnap' ? (
                    <>
                      <PaymentHelp>
                        Le <strong>Request Network Snap</strong> n’est pas
                        installé sur MetaMask. Installez-le pour pouvoir envoyer
                        votre clé d’encryption au marchand.
                      </PaymentHelp>
                      <ActionRow>
                        <PrimaryButton
                          type="button"
                          onClick={() => {
                            void handleInstallSnapFromModal();
                          }}
                        >
                          Installer le snap sur MetaMask
                        </PrimaryButton>
                        <SecondaryButton
                          type="button"
                          onClick={() => setModalStep('shareKey')}
                        >
                          Retour
                        </SecondaryButton>
                      </ActionRow>
                    </>
                  ) : null}
                </ModalDialog>
              </ModalOverlay>
            ) : null}
          </Panel>
        </div>
      </Layout>
    </Page>
  );
};

export default CheckoutPage;
