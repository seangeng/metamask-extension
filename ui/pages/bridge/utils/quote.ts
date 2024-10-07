import { calcTokenAmount } from '../../../../shared/lib/transactions-controller-utils';
import { QuoteResponse } from '../types';

// export const calculateFeesForQuote = (
//   { quote, trade, approval, estimatedL1GasInGwei }: QuoteResponseWithDetails,
//   nativeToken: NativeAsset,
//   estimatedFeePerGasInGwei: BigNumber,
//   srcTokenPrice?: number,
//   destTokenPrice?: number,
//   srcNativeTokenPriceInUSD?: number,
//   destNativeTokenPriceInUSD?: number,
//   removeExcessAllowanceTx?: TxData,
// ): Pick<
//   QuoteResponseWithDetails,
//   | 'gasFees'
//   | 'gasAdjustedReturnInUsd'
//   | 'returnInUsd'
//   | 'sentAmount'
//   | 'bridgeFees'
//   | 'mmFees'
//   | 'targetContractAddress'
//   | 'relayerFee'
//   | 'refuelFees'
//   | 'refuelSrcAmount'
//   | 'refuelDestAmount'
//   | 'receivedAmountAfterFeesInUsd'
// > => {
//   const destAmountInUSD = destTokenPrice
//     ? destTokenPrice *
//       Number(
//         getDisplayAmountFromAtomicAmount(
//           quote.destTokenAmount,
//           quote.destAsset.decimals,
//         ),
//       )
//     : undefined;

//   const srcAmountInUSD = srcTokenPrice
//     ? srcTokenPrice *
//       Number(utils.formatUnits(quote.srcTokenAmount, quote.srcAsset.decimals))
//     : undefined;
//   const mmFeeAmount = quote.feeData[FeeType.METABRIDGE].amount;
//   const mmFeeInUSD = srcTokenPrice
//     ? srcTokenPrice *
//       Number(utils.formatUnits(mmFeeAmount, quote.srcAsset.decimals))
//     : undefined;

//   // Does not include relayerFee or socket refuel amount. Includes lifi refuel src amount
//   const sentAmount = BigNumber.from(quote.srcTokenAmount)
//     .add(quote.feeData[FeeType.METABRIDGE].amount)
//     .toString();
//   const sentAmountInUsd = (srcAmountInUSD ?? 0) + (mmFeeInUSD ?? 0);

//   const refuelSrcAmount = {
//     raw: Number(quote.refuel?.srcAmount ?? '0'),
//     usd:
//       // TODO this doesn't work for lifi bc lifi srcAmount can be in srcToken
//       srcNativeTokenPriceInUSD &&
//       quote.refuel?.srcAmount &&
//       quote.bridgeId === AggId.SOCKET
//         ? srcNativeTokenPriceInUSD *
//           Number(
//             utils.formatUnits(
//               quote.refuel.srcAmount,
//               quote.refuel.srcAsset.decimals,
//             ),
//           )
//         : 0,
//     symbol: quote.refuel?.srcAsset.symbol ?? '',
//   };
//   const refuelDestAmount = {
//     raw: Number(quote.refuel?.destAmount ?? '0'),
//     usd:
//       destNativeTokenPriceInUSD && quote.refuel?.destAmount
//         ? destNativeTokenPriceInUSD *
//           Number(
//             utils.formatUnits(
//               quote.refuel.destAmount,
//               quote.refuel.destAsset.decimals,
//             ),
//           )
//         : 0,
//     symbol: quote.refuel?.destAsset.symbol ?? '',
//   };
//   const refuelAmountDiffInUsd = refuelSrcAmount.usd - refuelDestAmount.usd;
//   const refuelAmountDiffInDestNativeToken =
//     destNativeTokenPriceInUSD && srcNativeTokenPriceInUSD
//       ? (
//           (refuelAmountDiffInUsd *
//             Math.pow(10, quote.refuel?.destAsset.decimals ?? 0)) /
//           destNativeTokenPriceInUSD
//         ).toString()
//       : undefined;
//   // gets subtracted from received refuel dest amount
//   const refuelFees = {
//     raw: Number(
//       quote.feeData[FeeType.REFUEL]?.amount ??
//         refuelAmountDiffInDestNativeToken ??
//         0,
//     ),
//     usd: refuelAmountDiffInUsd,
//     symbol: quote.refuel?.destAsset.symbol ?? '',
//   };

//   const tradeValue = BigNumber.from(trade.value);
//   const relayerFee = (
//     isNativeToken(quote.srcAsset.address)
//       ? tradeValue.sub(sentAmount)
//       : tradeValue
//   ).sub(quote.bridgeId === AggId.SOCKET ? quote.refuel?.srcAmount ?? 0 : 0);
//   const relayerFeeInEth = Number(
//     getDisplayAmountFromAtomicAmount(
//       relayerFee.toString(),
//       nativeToken.decimals,
//     ),
//   );
//   const relayerFeeInUsd = srcNativeTokenPriceInUSD
//     ? srcNativeTokenPriceInUSD * relayerFeeInEth
//     : undefined;

//   const bridgeFeeInUsd =
//     srcAmountInUSD && destAmountInUSD ? srcAmountInUSD - destAmountInUSD : 0;
//   // Display 0 bridge fees if the dest USD amount is greater than the src USD amount
//   const normalizedBridgeFeeInUsd = bridgeFeeInUsd > 0 ? bridgeFeeInUsd : 0;
//   const bridgeFee = srcTokenPrice
//     ? getAtomicAmountFromDisplayAmount(
//         normalizedBridgeFeeInUsd / srcTokenPrice,
//         quote.srcAsset.decimals,
//       )
//     : 0;

//   const totalGasLimit = BigNumber.from(trade.gasLimit)
//     .add(approval?.gasLimit || 0)
//     .add(removeExcessAllowanceTx?.gasLimit || 0);
//   const gasFeesInGwei = estimatedFeePerGasInGwei
//     .mul(totalGasLimit)
//     .add(estimatedL1GasInGwei || 0);
//   const gasFeesInEth = Number(utils.formatUnits(gasFeesInGwei, 18));
//   const gasFeesInUSD = srcNativeTokenPriceInUSD
//     ? gasFeesInEth * srcNativeTokenPriceInUSD
//     : undefined;

//   const receivedAmountAfterFeesInUsd =
//     (destAmountInUSD ?? 0) + refuelDestAmount.usd;

//   //fallback to dest token amount if token price or gas price cannot be calculated
//   const gasAdjustedReturnInUsd =
//     gasFeesInUSD && destAmountInUSD
//       ? destAmountInUSD +
//         refuelDestAmount.usd -
//         gasFeesInUSD -
//         (relayerFeeInUsd || 0) -
//         refuelFees.usd
//       : Number(
//           getDisplayAmountFromAtomicAmount(
//             quote.destTokenAmount,
//             quote.destAsset.decimals,
//           ),
//         );
//   return {
//     gasFees: {
//       raw: Number(gasFeesInGwei.toString()),
//       usd: gasFeesInUSD,
//       symbol: nativeToken.symbol,
//     },
//     gasAdjustedReturnInUsd,
//     returnInUsd: destAmountInUSD,
//     sentAmount: { raw: sentAmount, usd: sentAmountInUsd }, // total including fees, excl gas
//     receivedAmountAfterFeesInUsd,
//     bridgeFees: { raw: Number(bridgeFee), usd: normalizedBridgeFeeInUsd }, // excludes MM fee
//     mmFees: { raw: Number(mmFeeAmount), usd: mmFeeInUSD }, // MM fee
//     targetContractAddress: trade.to,
//     relayerFee: {
//       raw: Number(relayerFee),
//       usd: relayerFeeInUsd,
//       symbol: nativeToken.symbol,
//     },
//     refuelFees,
//     refuelSrcAmount,
//     refuelDestAmount,
//   };
// };

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
