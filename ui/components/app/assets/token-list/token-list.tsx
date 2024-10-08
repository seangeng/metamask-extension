import React from 'react';
import { useSelector } from 'react-redux';
import TokenCell from '../token-cell';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Box } from '../../../component-library';
import {
  AlignItems,
  Display,
  JustifyContent,
} from '../../../../helpers/constants/design-system';
import { TokenWithBalance } from '../asset-list/asset-list';
import { getMultichainCurrentChainId } from '../../../../selectors/multichain';

type TokenListProps = {
  onTokenClick: (arg: string) => void;
  tokens: TokenWithBalance[];
  loading: boolean;
};

export default function TokenList({
  onTokenClick,
  tokens,
  loading = false,
}: TokenListProps) {
  const t = useI18nContext();
  const chainId = useSelector(getMultichainCurrentChainId);

  if (loading) {
    return (
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        padding={7}
        data-testid="token-list-loading-message"
      >
        {t('loadingTokens')}
      </Box>
    );
  }

  return (
    <div>
      {tokens.map((tokenData, index) => (
        <TokenCell
          key={index}
          {...{ ...tokenData, chainId }}
          onClick={onTokenClick}
        />
      ))}
    </div>
  );
}
