import { useSelector } from 'react-redux';
import {
  getBridgeQuotes,
  getFromChain,
  getToChain,
  getToToken,
} from '../../ducks/bridge/selectors';
import { useEffect, useMemo, useState } from 'react';
import { calcTokenAmount } from '../../../shared/lib/transactions-controller-utils';
import { fetchTokenExchangeRates } from '../../helpers/utils/util';
import { CHAIN_ID_TO_CURRENCY_SYMBOL_MAP } from '../../../shared/constants/network';
import { Quote, QuoteResponse } from '../../pages/bridge/types';
import { zeroAddress } from '../../__mocks__/ethereumjs-util';
import BigNumber from 'bignumber.js';
import { getConversionRate } from '../../ducks/metamask/metamask';
import { useGasFeeEstimates } from '../useGasFeeEstimates';
import { getSelectedNetworkClientId } from '../../selectors';

interface BridgeQuoteAmount {
  raw: BigNumber;
  fiat: BigNumber | null;
}

// Returns fees and amounts for the quotes
const useBridgeAmounts = () => {
  const { quotes } = useSelector(getBridgeQuotes);
  // TODO read from quote instead of state
  const toChain = useSelector(getToChain);
  const toToken = useSelector(getToToken);

  const selectedNetworkClientId = useSelector(getSelectedNetworkClientId);

  const { gasEstimateType, gasFeeEstimates, isNetworkBusy } =
    useGasFeeEstimates(selectedNetworkClientId);

  const getFromToken = (bridgeQuote: Quote) => bridgeQuote.srcAsset;
  const getSrcTokenAmountPlusMBFees = (bridgeQuote: Quote) =>
    new BigNumber(bridgeQuote.srcTokenAmount).plus(
      bridgeQuote.feeData.metabridge.amount,
    );

  // Returns fromToken to src native asset exchange rate
  // const fromTokenExchangeRates: Record<string, number> = useSelector(
  //   getTokenExchangeRates,
  //   shallowEqual,
  // );

  const fromNativeExchangeRate = useSelector(getConversionRate);

  // Contains toToken to dest native asset exchange rate
  const [toTokenExchangeRate, setToTokenExchangeRate] = useState<
    number | undefined
  >();
  const [toNativeExchangeRate, setToNativeExchangeRate] = useState<number>(1);

  useEffect(() => {
    if (toChain?.chainId && toToken?.address)
      fetchTokenExchangeRates(
        CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[
          toChain.chainId as keyof typeof CHAIN_ID_TO_CURRENCY_SYMBOL_MAP
        ],
        [toToken.address],
        toChain.chainId,
      ).then((exchangeRates) => {
        setToNativeExchangeRate(exchangeRates[zeroAddress()] ?? 1);
        if (toToken.address !== zeroAddress()) {
          setToTokenExchangeRate(exchangeRates[toToken.address.toLowerCase()]);
        } else {
          setToTokenExchangeRate(1);
        }
      });
  }, [toChain, toToken]);

  const toAmounts: Record<string, BridgeQuoteAmount> = useMemo(() => {
    return Object.fromEntries(
      quotes.map((quote) => [
        quote.quote.requestId,
        {
          raw: calcTokenAmount(
            quote.quote.destTokenAmount,
            quote.quote.destAsset.decimals,
          ),
          fiat: toTokenExchangeRate
            ? calcTokenAmount(
                quote.quote.destTokenAmount,
                quote.quote.destAsset.decimals,
              )
                .mul(toTokenExchangeRate)
                .mul(toNativeExchangeRate)
            : null,
        },
      ]),
    );
  }, [toTokenExchangeRate, quotes]);

  // TODO include reset approval gas
  const getTotalGasLimits = ({ approval, trade }: QuoteResponse) =>
    new BigNumber(trade.gasLimit ?? 0).plus(approval?.gasLimit ?? 0);

  const gasFees: Record<string, BridgeQuoteAmount> = useMemo(() => {
    return Object.fromEntries(
      quotes.map((quote) => {
        const totalGasLimit = getTotalGasLimits(quote);
        return [
          quote.quote.requestId,
          {
            raw: totalGasLimit,
            fiat: totalGasLimit,
          },
        ];
      }),
    );
  }, []);

  const relayerFees: Record<string, BridgeQuoteAmount> = useMemo(() => {
    return Object.fromEntries(
      quotes.map((quote) => {
        const relayerFeeInNative = calcTokenAmount(
          new BigNumber(quote.trade.value).minus(
            getFromToken(quote.quote).address === zeroAddress()
              ? getSrcTokenAmountPlusMBFees(quote.quote)
              : 0,
          ),
          18,
        );
        return [
          quote.quote.requestId,
          {
            raw: relayerFeeInNative,
            fiat: fromNativeExchangeRate
              ? relayerFeeInNative.mul(fromNativeExchangeRate)
              : null,
          },
        ];
      }),
    );
  }, []);

  const swapRate = useMemo(() => {
    return Object.fromEntries(
      quotes.map((quote) => [
        quote.quote.requestId,
        quote.quote.destTokenAmount,
      ]),
    );
  }, []);

  return {
    toAmounts,
    gasFees,
    relayerFees,
    swapRate,
  };
};

export default useBridgeAmounts;
