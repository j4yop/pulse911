import React from 'react';

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  priority?: boolean;
}

export const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  ({ priority: _priority, ...props }, ref) => {
    return <img ref={ref} {...props} />;
  }
);
Image.displayName = 'Image';

export default Image;
