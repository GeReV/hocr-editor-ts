import React, { PropsWithChildren } from "react";
import cx from 'classnames';

import './index.scss';

interface Props {
  className?: string;
}

function Header({ children, className }: PropsWithChildren<Props>) {
  return (
    <header className={cx('Header', className)}>
      {children}
    </header>
  );
}

export default React.memo(Header);