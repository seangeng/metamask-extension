import { useSelector } from 'react-redux';
import { getBridgeQuotes } from '../../ducks/bridge/selectors';
import { useMemo } from 'react';
import { calcTokenAmount } from '../../../shared/lib/transactions-controller-utils';
import useBridgeAmounts from './useBridgeAmounts';
import { mapValues, orderBy } from 'lodash';

const useBridgeQuotes = () => {
  const { quotes } = useSelector(getBridgeQuotes);

  const quotesByRequestId = useMemo(() => {
    return Object.fromEntries(
      quotes.map((quote) => [quote.quote.requestId, quote]),
    );
  }, [quotes]);

  const { toAmounts, gasFees, relayerFees } = useBridgeAmounts();

  /* Sorting
  - DONE Map quotes: {[Quote.requestId]: Quote}
  - Fees: {[Quote.requestId]]: {FeeId: BridgeQuoteAmount}}
  - Amounts: {[Quote.requestId]: {[src | dest]: BridgeQuoteAmount}}
  - Sorted quote hashes: [Quote.requestId]
  - Recommended quote: Quote.requestId
  */
  // TODO Calculate fees and fiat amounts

  const sortedByAdjustedReturn = useMemo(() => {
    const adjustedReturnByRequestId = mapValues(
      toAmounts,
      (toAmount, requestId) => {
        return toAmount.fiat
          ?.minus(gasFees?.[requestId].fiat ?? 0)
          .minus(relayerFees?.[requestId].fiat ?? 0);
      },
    );

    return orderBy(
      Object.entries(adjustedReturnByRequestId),
      ([, value]) => value,
      'desc', // Sort in descending order (highest to lowest)
    ).map(([key]) => key);
  }, [toAmounts, gasFees, relayerFees]);

  const recommendedQuote = useMemo(() => {
    // TODO implement sorting
    // TODO select based on ETA
    if (!sortedByAdjustedReturn.length) return undefined;
    let recommendedQuote = quotesByRequestId[sortedByAdjustedReturn[0]];
    sortedByAdjustedReturn.forEach((requestId) => {
      // TODO if time is too long, select next quote
      // else return
      quotesByRequestId[requestId];
    });
    return recommendedQuote;
  }, [sortedByAdjustedReturn]);

  // TODO test for excessive re-renders
  const toAmount = useMemo(() => {
    return recommendedQuote
      ? calcTokenAmount(
          recommendedQuote.quote.destTokenAmount,
          recommendedQuote.quote.destAsset.decimals,
        )
          .toFixed(3)
          .toString()
      : undefined;
  }, [recommendedQuote]);

  return {
    recommendedQuote,
    toAmount: toAmount,
    sortedQuotes: sortedByAdjustedReturn.map(
      (requestId) => quotesByRequestId[requestId],
    ),
  };
};

export default useBridgeQuotes;
