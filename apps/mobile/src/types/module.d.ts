declare module '@civicsense/types' {
  export * from '@civicsense/types/src';
}

declare module '@civicsense/types/*' {
  const content: any;
  export default content;
  export * from '@civicsense/types/src/*';
}

declare module '@civicsense/business-logic/*' {
  const content: any;
  export default content;
}

declare module '@civicsense/design-tokens' {
  export * from '@civicsense/design-tokens/src';
}

declare module '@civicsense/design-tokens/*' {
  const content: any;
  export default content;
  export * from '@civicsense/design-tokens/src/*';
}

// Add support for .css imports
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

// Add support for image imports
declare module '*.png' {
  const content: any;
  export default content;
}

declare module '*.jpg' {
  const content: any;
  export default content;
}

declare module '*.svg' {
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
} 