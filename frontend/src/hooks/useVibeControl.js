import { useState } from 'react';

export const useVibeControl = () => {
  const [captionType, setCaptionType] = useState('default');
  const [vibes, setVibes] = useState({
    humor: 30,
    romance: 20,
    energy: 50,
    formality: 20,
    sarcasm: 10,
    poeticism: 20
  });
  const [useVibeSliders, setUseVibeSliders] = useState(false);
  const [showAllTypes, setShowAllTypes] = useState(false);

  const getTweakPresets = () => ({
    funnier: { humor: Math.min(100, vibes.humor + 20), formality: Math.max(0, vibes.formality - 10) },
    romantic: { romance: Math.min(100, vibes.romance + 25), sarcasm: Math.max(0, vibes.sarcasm - 15) },
    energetic: { energy: Math.min(100, vibes.energy + 20), humor: Math.min(100, vibes.humor + 10) },
    simpler: { poeticism: Math.max(0, vibes.poeticism - 15), sarcasm: Math.max(0, vibes.sarcasm - 10) }
  });

  const applyTweak = (tweakType) => {
    const tweaks = getTweakPresets();
    const newVibes = { ...vibes, ...tweaks[tweakType] };
    setVibes(newVibes);
    setUseVibeSliders(true);
    return newVibes;
  };

  return {
    captionType,
    setCaptionType,
    vibes,
    setVibes,
    useVibeSliders,
    setUseVibeSliders,
    showAllTypes,
    setShowAllTypes,
    applyTweak
  };
};
