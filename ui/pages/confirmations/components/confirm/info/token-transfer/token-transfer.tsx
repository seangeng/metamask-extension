import React from 'react';
import { useSelector } from 'react-redux';
import { selectConfirmationAdvancedDetailsOpen } from '../../../../selectors/preferences';
import { AdvancedDetails } from '../shared/advanced-details/advanced-details';
import { GasFeesSection } from '../shared/gas-fees-section/gas-fees-section';
import SendHeading from '../shared/send-heading/send-heading';
import { TokenDetailsSection } from './token-details-section';
import { TransactionFlowSection } from './transaction-flow-section';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import { SimulationDetails } from '../../../simulation-details';
import { useConfirmContext } from '../../../../context/confirm';
import { TransactionMeta } from '@metamask/transaction-controller';

const TokenTransferInfo = () => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const showAdvancedDetails = useSelector(
    selectConfirmationAdvancedDetailsOpen,
  );

  const isWalletInitiated = transactionMeta.origin === 'metamask';

  return (
    <>
      <SendHeading />
      <TransactionFlowSection />
      {!isWalletInitiated && (
        <ConfirmInfoSection noPadding>
          <SimulationDetails
            simulationData={transactionMeta.simulationData}
            transactionId={transactionMeta.id}
            isTransactionsRedesign
          />
        </ConfirmInfoSection>
      )}
      <TokenDetailsSection />
      <GasFeesSection />
      {showAdvancedDetails && <AdvancedDetails />}
    </>
  );
};

export default TokenTransferInfo;
