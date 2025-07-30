export type Attribute = {
    /** Observer */
    observer?: string;
    /** Label */
    label: string;
    /** Path alias */
    alias?: string;
    /** Path */
    path?: string;
    /** Paths */
    paths?: string[];
    /** UI type */
    type: string;
    /** UI args */
    args?: Record<string, any>;
    /** Value */
    value?: any;
    /** UI args */
    enabled?: boolean;
    /** Attribute reference (tooltip) */
    reference?: string;
    /** Tooltip */
    tooltip?: {
      /** Tooltip title */
      title: string;
      /** Tooltip subtitle */
      subTitle?: string;
      /** Tooltip description */
      description: string;
    };
  };

export type Divider = {
    type: 'divider';
    /** Alias */
    alias?: string;
};
