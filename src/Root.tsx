import { Composition, staticFile } from 'remotion';
import { getAudioData } from '@remotion/media-utils';
import { MyComposition, myCompSchema, MyCompProps } from './Composition';
import './style.css';

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition<MyCompProps, {audioFile: string; backgroundImage: string}>
				id="MyComp"
				component={MyComposition}
				fps={30}
				width={1080}
				height={1920}
				schema={myCompSchema}
				defaultProps={{
					audioFile: '3f94d056-621e-4d94-9b8b-89e5e726d6a1.mp3',
					backgroundImage: 'background.jpg',
				}}
				calculateMetadata={async ({props}) => {
					const fps = 30;

					const audioData = await getAudioData(staticFile(props.audioFile));
					const durationInFrames = secondsToFrames(
						audioData.durationInSeconds,
						fps
					);
					return {
						durationInFrames,
						props: {
							audioFile: props.audioFile,
							backgroundImage: props.backgroundImage,
						},
					};
				}}
			/>
		</>
	);
};

function secondsToFrames(float: number, fps: number) {
	return Math.floor(float * fps);
}