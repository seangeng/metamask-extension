import React, { useRef, useState } from 'react';
import {
  Box,
  ButtonBase,
  ButtonBaseSize,
  IconName,
  Popover,
  PopoverPosition,
} from '../../../../component-library';
import SortControl from '../sort-control';
import {
  BackgroundColor,
  BorderColor,
  BorderStyle,
  Display,
  JustifyContent,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import ImportControl from '../import-control';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../../../../app/scripts/lib/util';
import {
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_POPUP,
} from '../../../../../../shared/constants/app';

type AssetListControlBarProps = {
  showTokensLinks?: boolean;
};

const AssetListControlBar = ({ showTokensLinks }: AssetListControlBarProps) => {
  const t = useI18nContext();
  const controlBarRef = useRef<HTMLDivElement>(null); // Create a ref
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const windowType = getEnvironmentType();
  const isFullScreen =
    windowType !== ENVIRONMENT_TYPE_NOTIFICATION &&
    windowType !== ENVIRONMENT_TYPE_POPUP;

  const handleOpenPopover = () => {
    setIsPopoverOpen(!isPopoverOpen);
  };

  const closePopover = () => {
    setIsPopoverOpen(false);
  };

  return (
    <Box
      className="asset-list-control-bar"
      ref={controlBarRef}
      display={Display.Flex}
      justifyContent={JustifyContent.spaceBetween}
      marginLeft={4}
      marginRight={4}
      paddingTop={4}
    >
      <ButtonBase
        data-testid="sort-by-popover-toggle"
        className="asset-list-control-bar__button"
        onClick={handleOpenPopover}
        size={ButtonBaseSize.Sm}
        endIconName={IconName.ArrowDown}
        backgroundColor={
          isPopoverOpen
            ? BackgroundColor.backgroundPressed
            : BackgroundColor.backgroundDefault
        }
        borderColor={BorderColor.borderMuted}
        borderStyle={BorderStyle.solid}
        color={TextColor.textDefault}
      >
        {t('sortBy')}
      </ButtonBase>
      <ImportControl showTokensLinks={showTokensLinks} />
      <Popover
        onClickOutside={closePopover}
        isOpen={isPopoverOpen}
        position={PopoverPosition.BottomStart}
        referenceElement={controlBarRef.current}
        matchWidth={!isFullScreen}
        style={{
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          minWidth: isFullScreen ? '325px' : '',
        }}
      >
        <SortControl handleClose={closePopover} />
      </Popover>
    </Box>
  );
};

export default AssetListControlBar;
