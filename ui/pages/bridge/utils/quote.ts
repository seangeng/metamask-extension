import BigNumber from 'bignumber.js';
import { calcTokenAmount } from '../../../../shared/lib/transactions-controller-utils';
import { Quote, QuoteResponse } from '../types';
import { zeroAddress } from 'ethereumjs-util';

// TODO include reset approval gas
export const getTotalGasFee = (
  bridgeQuote: QuoteResponse,
  fromNativeExchangeRate?: number,
) => {
  const {
    approval,
    trade,
    quote: { requestId },
  } = bridgeQuote;

  const totalGasLimit = new BigNumber(trade.gasLimit ?? 0).plus(
    approval?.gasLimit ?? 0,
  );

  // TODO follow gas calculation in https://github.com/MetaMask/metamask-extension/pull/27612
  return [
    requestId,
    {
      raw: totalGasLimit,
      fiat: fromNativeExchangeRate
        ? totalGasLimit.mul(fromNativeExchangeRate)
        : null,
    },
  ];
};

export const getRelayerFee = (
  bridgeQuote: QuoteResponse,
  fromNativeExchangeRate?: string,
) => {
  const {
    quote: { srcAsset, srcTokenAmount, feeData, requestId },
    trade,
  } = bridgeQuote;
  const relayerFeeInNative = calcTokenAmount(
    new BigNumber(trade.value).minus(
      srcAsset.address === zeroAddress()
        ? new BigNumber(srcTokenAmount).plus(feeData.metabridge.amount)
        : 0,
    ),
    18,
  );
  return [
    requestId,
    {
      raw: relayerFeeInNative,
      fiat: fromNativeExchangeRate
        ? relayerFeeInNative.mul(fromNativeExchangeRate)
        : null,
    },
  ];
};

export const getQuoteDisplayData = (quoteResponse?: QuoteResponse) => {
  const { quote, estimatedProcessingTimeInSeconds } = quoteResponse ?? {};
  if (!quoteResponse || !quote || !estimatedProcessingTimeInSeconds) return {};

  const etaInMinutes = (estimatedProcessingTimeInSeconds / 60).toFixed();
  const quoteRate = `1 ${quote.srcAsset.symbol} = ${calcTokenAmount(
    quote.destTokenAmount,
    quote.destAsset.decimals,
  )
    .div(calcTokenAmount(quote.srcTokenAmount, quote.srcAsset.decimals))
    .toFixed(4)
    .toString()} ${quote.destAsset.symbol}`;

  return {
    etaInMinutes,
    totalFees: {
      amount: '0.01 ETH', // TODO implement
      fiat: '$0.01',
    },
    quoteRate,
  };
};
