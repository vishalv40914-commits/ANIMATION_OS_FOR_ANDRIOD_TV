import React, { useState } from 'react';

interface AppIconProps {
  appId: string;
  name: string;
  logoUrl?: string;
  iconName?: string;
  isFocused: boolean;
  className?: string;
}

export const AppIcon: React.FC<AppIconProps> = ({
  appId,
  name,
  logoUrl,
  isFocused,
  className = 'w-full h-full'
}) => {
  const [imgError, setImgError] = useState(false);

  // Derive logo path if not explicitly provided or if load failed
  let resolvedLogo = logoUrl;
  if (!resolvedLogo || imgError) {
    const norm = (name + ' ' + appId).toLowerCase();
    if (norm.includes('youtube') && !norm.includes('music')) resolvedLogo = '/assets/app-logos/youtube.svg';
    else if (norm.includes('netflix')) resolvedLogo = '/assets/app-logos/netflix.svg';
    else if (norm.includes('prime')) resolvedLogo = '/assets/app-logos/prime-video.svg';
    else if (norm.includes('spotify')) resolvedLogo = '/assets/app-logos/spotify.svg';
    else if (norm.includes('music')) resolvedLogo = '/assets/app-logos/music.svg';
    else if (norm.includes('game')) resolvedLogo = '/assets/app-logos/games.svg';
    else if (norm.includes('setting')) resolvedLogo = '/assets/app-logos/settings.svg';
    else if (norm.includes('myapps') || norm.includes('my apps') || norm.includes('manager')) resolvedLogo = '/assets/app-logos/my-apps.svg';
    else if (norm.includes('disney')) resolvedLogo = '/assets/app-logos/disney-plus.svg';
    else if (norm.includes('twitch')) resolvedLogo = '/assets/app-logos/twitch.svg';
    else if (norm.includes('browser')) resolvedLogo = '/assets/app-logos/browser.svg';
    else resolvedLogo = '/assets/app-logos/my-apps.svg';
  }

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Real Brand Logo Asset */}
      <img
        src={resolvedLogo}
        alt={name}
        onError={() => setImgError(true)}
        className={`w-full max-h-11 md:max-h-13 max-w-[85%] object-contain filter drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] transition-transform duration-200 ${
          isFocused ? 'scale-108' : 'scale-95 opacity-90'
        }`}
        loading="eager"
      />
    </div>
  );
};
