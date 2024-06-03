import { useVideoConfig, useCurrentFrame, AbsoluteFill, Audio, Img, staticFile } from 'remotion';
import { z } from 'zod';
import { RadialBarsVisualization } from './RadialBarsVisualization';
import { AudioData, useAudioData, visualizeAudio } from '@remotion/media-utils';

export const myCompSchema = z.object({
	audioFile: z.string(),
	backgroundImage: z.string(),
});

export type MyCompProps = z.infer<typeof myCompSchema>;

export const MyComposition: React.FC<MyCompProps> = ({
  audioFile,
  backgroundImage,
}) => {
  const speakersMetadata = [
    {
      name: 'Aaron',
      color: '#0b0b0b',
      picture: staticFile('andhbhakth.webp'),
      speakerLabel: 'A',
    },
  ];

  const combineValues = (length: number, sources: Array<number[]>): number[] => {
    return Array.from({ length }).map((_, i) => {
      return sources.reduce((acc, source) => {
        return Math.max(acc, source[i]);
      }, 0);
    });
  };

  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const speechData = useAudioData(staticFile(audioFile));

  if (!speechData) return null;

  const nSamples = 512;

  const visualizeMultipleAudio = ({
    sources,
    ...options
  }: {
    frame: number;
    fps: number;
    numberOfSamples: number;
    sources: Array<AudioData>;
    smoothing?: boolean | undefined;
  }) => {
    const sourceValues = sources.map((source) => {
      return visualizeAudio({ ...options, audioData: source });
    });
    return combineValues(options.numberOfSamples, sourceValues);
  };

  const visualizationValues = visualizeMultipleAudio({
    fps,
    frame,
    sources: [speechData],
    numberOfSamples: nSamples,
  });

  const frequencyData = visualizationValues.slice(0, 0.7 * nSamples);

  return (
    <>
      <AbsoluteFill>
        <Img
          src={staticFile(backgroundImage)}
          className="h-full w-full object-cover object-center"
        />
      </AbsoluteFill>

      <AbsoluteFill>
        <div className="bg-zinc-900 mx-12 my-10 h-full rounded-md shadow-2xl flex items-center justify-center">
          <div className="relative" style={{ marginTop: '120%' }}>
            {speakersMetadata.map((speakerMetadata, index) => (
              <div
                key={index}
                className="flex flex-col items-center rounded-md"
              >
                <div className="relative flex items-center justify-center">
                  <Img
                    src={speakerMetadata.picture}
                    className="size-72 rounded-full shadow-xl overflow-hidden"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <RadialBarsVisualization
                      frequencyData={frequencyData}
                      diameter={550}
                      innerRadius={142}
                      color="#F4BF43"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AbsoluteFill>

      <div className="absolute bottom-20 left-12">
        <p className="px-2 py-0.5 text-white bg-zinc-900/20 text-5xl">
          - Andh Bhakth (no f'em)
        </p>
      </div>

      <Audio src={staticFile(audioFile)} />
    </>
  );
};