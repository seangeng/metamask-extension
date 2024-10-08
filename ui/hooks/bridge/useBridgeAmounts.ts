import { shallowEqual, useSelector } from 'react-redux';
import {
  getBridgeQuotes,
  getToChain,
  getToToken,
} from '../../ducks/bridge/selectors';
import { useEffect, useMemo, useState } from 'react';
import { calcTokenAmount } from '../../../shared/lib/transactions-controller-utils';
import { fetchTokenExchangeRates } from '../../helpers/utils/util';
import {
  CHAIN_ID_TO_CURRENCY_SYMBOL_MAP,
  CHAIN_IDS,
} from '../../../shared/constants/network';
import { zeroAddress } from '../../__mocks__/ethereumjs-util';
import BigNumber from 'bignumber.js';
import { getConversionRate } from '../../ducks/metamask/metamask';
import { getTokenExchangeRates } from '../../selectors';
import { getRelayerFee, getTotalGasFee } from '../../pages/bridge/utils/quote';
import { RequestStatus } from '../../../app/scripts/controllers/bridge/constants';
import { toChecksumAddress } from 'ethereumjs-util';
import { deepEqual } from 'assert';
import { isEqual } from 'lodash';
import { useAsyncResult } from '../useAsyncResult';

interface BridgeQuoteAmount {
  raw: BigNumber;
  fiat: BigNumber | null;
}

// Returns fees and amounts for the quotes
const useBridgeAmounts = () => {
  const { quotes } = useSelector(getBridgeQuotes);
  const toChain = useSelector(getToChain, isEqual);
  const toToken = useSelector(getToToken, isEqual);
  // Returns fromToken to src native asset exchange rate
  const fromTokenExchangeRates: Record<string, number> = useSelector(
    getTokenExchangeRates,
    shallowEqual,
  );

  const fromNativeExchangeRate = useSelector(getConversionRate);

  // Contains toToken to dest native asset exchange rate
  const [toTokenExchangeRate, setToTokenExchangeRate] = useState<
    number | undefined
  >();
  const [toNativeExchangeRate, setToNativeExchangeRate] = useState<number>(1);

  const { pending: isToTokenExchangeRateLoading, value: exchangeRates } =
    useAsyncResult(async () => {
      if (toChain?.chainId && toToken?.address) {
        return await fetchTokenExchangeRates(
          CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[
            toChain.chainId as keyof typeof CHAIN_ID_TO_CURRENCY_SYMBOL_MAP
          ],
          [toToken.address],
          toChain.chainId,
        );
      }
    }, [toChain, toToken]);

  useEffect(() => {
    if (
      toChain?.chainId &&
      toToken?.address &&
      exchangeRates &&
      !isToTokenExchangeRateLoading
    ) {
      setToNativeExchangeRate(exchangeRates[zeroAddress()] ?? 1);
      if (toToken.address !== zeroAddress()) {
        setToTokenExchangeRate(
          exchangeRates[toChecksumAddress(toToken.address)],
        );
      } else {
        setToTokenExchangeRate(1);
      }
    }
  }, [toChain, toToken, exchangeRates]);

  const toAmounts: Record<string, BridgeQuoteAmount> = useMemo(() => {
    return Object.fromEntries(
      quotes.map((quote) => {
        const normalizedDestAmount = calcTokenAmount(
          quote.quote.destTokenAmount,
          quote.quote.destAsset.decimals,
        );
        return [
          quote.quote.requestId,
          {
            raw: normalizedDestAmount,
            fiat:
              toTokenExchangeRate && toNativeExchangeRate
                ? normalizedDestAmount
                    .mul(toTokenExchangeRate.toString())
                    .mul(toNativeExchangeRate.toString())
                : null,
          },
        ];
      }),
    );
  }, [toTokenExchangeRate, toNativeExchangeRate, quotes]);

  const fromAmounts: Record<string, BridgeQuoteAmount> = useMemo(() => {
    return Object.fromEntries(
      quotes.map(({ quote: { requestId, srcTokenAmount, srcAsset } }) => {
        const normalizedTokenAmount = calcTokenAmount(
          srcTokenAmount,
          srcAsset.decimals,
        );
        return [
          requestId,
          {
            raw: normalizedTokenAmount,
            fiat:
              fromTokenExchangeRates?.[srcAsset.symbol] &&
              fromNativeExchangeRate
                ? normalizedTokenAmount
                    .mul(fromTokenExchangeRates[srcAsset.address].toString())
                    .mul(fromNativeExchangeRate.toString())
                : null,
          },
        ];
      }),
    );
  }, [fromTokenExchangeRates, fromNativeExchangeRate, quotes]);

  const gasFees: Record<string, BridgeQuoteAmount> = useMemo(() => {
    return Object.fromEntries(
      quotes.map((quote) => {
        return getTotalGasFee(quote, fromNativeExchangeRate);
      }),
    );
  }, [quotes, fromNativeExchangeRate]);

  const relayerFees: Record<string, BridgeQuoteAmount> = useMemo(() => {
    return Object.fromEntries(
      quotes.map((quote) => getRelayerFee(quote, fromNativeExchangeRate)),
    );
  }, [quotes, fromNativeExchangeRate]);

  const swapRate = useMemo(() => {
    return Object.fromEntries(
      quotes.map(({ quote: { requestId, srcAsset, destAsset } }) => [
        requestId,
        `1 ${srcAsset.symbol} = ${toAmounts[requestId].raw.div(
          fromAmounts[requestId].raw,
        )} ${destAsset.symbol}`,
      ]),
    );
  }, [fromAmounts, toAmounts]);

  return {
    toAmounts,
    gasFees,
    relayerFees,
    swapRate,
  };
};

export default useBridgeAmounts;
