import { ENV_WEB_ISOMORPHIC } from "@tans/env/web/env.isomorphic";
import { type WrapperImageProps } from "@tans/ui/components/image";
import { Image as RawImage } from "@tans/ui/components/image";

export function Image(props: WrapperImageProps) {
  return (
    <RawImage
      {...props}
      siteBaseUrl={ENV_WEB_ISOMORPHIC.VITE_WEB_URL}
      imgProxyBaseUrl={ENV_WEB_ISOMORPHIC.VITE_IMGPROXY_URL}
      imgProxySignature={ENV_WEB_ISOMORPHIC.VITE_IMGPROXY_SIGNATURE}
    />
  );
}
