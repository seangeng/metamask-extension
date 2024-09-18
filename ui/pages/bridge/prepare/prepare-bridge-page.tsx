import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import classnames from 'classnames';
import {
  setFromToken,
  setFromTokenInputValue,
  setToChain,
  setToToken,
  switchToAndFromInputs,
} from '../../../ducks/bridge/actions';
import {
  getFromAmount,
  getFromChain,
  getFromChains,
  getFromToken,
  getFromTokens,
  getFromTopAssets,
  getQuoteRequest,
  getToAmount,
  getToChain,
  getToChains,
  getToToken,
  getToTokens,
  getToTopAssets,
} from '../../../ducks/bridge/selectors';
import {
  Box,
  ButtonIcon,
  IconName,
} from '../../../components/component-library';
import { BlockSize } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { TokenBucketPriority } from '../../../../shared/constants/swaps';
import { useTokensWithFiltering } from '../../../hooks/useTokensWithFiltering';
import { setActiveNetwork } from '../../../store/actions';
import { BridgeQuoteCard } from '../quotes/bridge-quote-card';
import { BridgeInputGroup } from './bridge-input-group';

const PrepareBridgePage = () => {
  const dispatch = useDispatch();

  const t = useI18nContext();

  const fromToken = useSelector(getFromToken);
  const fromTokens = useSelector(getFromTokens);
  const fromTopAssets = useSelector(getFromTopAssets);

  const toToken = useSelector(getToToken);
  const toTokens = useSelector(getToTokens);
  const toTopAssets = useSelector(getToTopAssets);

  const fromChains = useSelector(getFromChains);
  const toChains = useSelector(getToChains);
  const fromChain = useSelector(getFromChain);
  const toChain = useSelector(getToChain);

  const fromAmount = useSelector(getFromAmount);
  const toAmount = useSelector(getToAmount);

  const { isValid: isQuoteRequestValid } = useSelector(getQuoteRequest);

  const fromTokenListGenerator = useTokensWithFiltering(
    fromTokens,
    fromTopAssets,
    TokenBucketPriority.owned,
    fromChain?.chainId,
  );
  const toTokenListGenerator = useTokensWithFiltering(
    toTokens,
    toTopAssets,
    TokenBucketPriority.top,
    toChain?.chainId,
  );

  const [rotateSwitchTokens, setRotateSwitchTokens] = useState(false);

  return (
    <div className="prepare-bridge-page">
      <Box className="prepare-bridge-page__content">
        <BridgeInputGroup
          className="bridge-box"
          header={t('bridgeFrom')}
          token={fromToken}
          onAmountChange={(e) => {
            dispatch(
              setFromTokenInputValue({
                amount: e,
                decimals: Number(fromToken.decimals),
              }),
            );
          }}
          onAssetChange={(token) => dispatch(setFromToken(token))}
          networkProps={{
            network: fromChain,
            networks: fromChains,
            onNetworkChange: (networkConfig) => {
              dispatch(
                setActiveNetwork(
                  networkConfig.rpcEndpoints[
                    networkConfig.defaultRpcEndpointIndex
                  ].networkClientId,
                ),
              );
              dispatch(setFromChain(networkConfig.chainId));
              // TODO emit metric
            },
          }}
          customTokenListGenerator={
            fromTokens && fromTopAssets ? fromTokenListGenerator : undefined
          }
          amountFieldProps={{
            testId: 'from-amount',
            autoFocus: true,
            value: fromAmount || undefined,
          }}
        />

        <Box className="prepare-bridge-page__switch-tokens">
          <ButtonIcon
            iconProps={{
              className: classnames({
                rotate: rotateSwitchTokens,
              }),
            }}
            width={BlockSize.Full}
            data-testid="switch-tokens"
            ariaLabel="switch-tokens"
            iconName={IconName.Arrow2Down}
            disabled={!isQuoteRequestValid}
            onClick={() => {
              setRotateSwitchTokens(!rotateSwitchTokens);
              const toChainClientId =
                toChain?.defaultRpcEndpointIndex && toChain?.rpcEndpoints
                  ? toChain.rpcEndpoints?.[toChain.defaultRpcEndpointIndex]
                      .networkClientId
                  : undefined;
              toChainClientId && dispatch(setActiveNetwork(toChainClientId));
              fromChain?.chainId &&
                dispatch(switchToAndFromInputs(fromChain?.chainId));
            }}
          />
        </Box>

        <BridgeInputGroup
          className="bridge-box"
          header={t('bridgeTo')}
          token={toToken}
          onAssetChange={(token) => dispatch(setToToken(token))}
          networkProps={{
            network: toChain,
            networks: toChains,
            onNetworkChange: (networkConfig) => {
              dispatch(setToChain(networkConfig.chainId));
            },
          }}
          customTokenListGenerator={
            toChain && toTokens && toTopAssets
              ? toTokenListGenerator
              : fromTokenListGenerator
          }
          amountFieldProps={{
            testId: 'to-amount',
            readOnly: true,
            disabled: true,
            value: toAmount ?? '0',
            className: toAmount ? 'amount-input defined' : 'amount-input',
          }}
        />
      </Box>

      <BridgeQuoteCard />
    </div>
  );
};

export default PrepareBridgePage;
