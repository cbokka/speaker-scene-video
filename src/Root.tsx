import { Composition, staticFile } from 'remotion';
import { getAudioData } from '@remotion/media-utils';
import { MyComposition, myCompSchema, MyCompProps } from './Composition';
import './style.css';

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition<MyCompProps, { audioFile: string; backgroundImage: string }>
				id="MyComp"
				component={MyComposition}
				fps={30}
				width={1080}
				height={1920}
				schema={myCompSchema}
				defaultProps={{
					audioFile: '',
					backgroundImage: '',
				}}
				calculateMetadata={async ({ props }) => {
					const fps = 30;
					console.log(`Calculating metadata for audioFile: ${props.audioFile}`);

					try {
						const audioData = await getAudioData(staticFile(props.audioFile));
						const durationInFrames = secondsToFrames(
							audioData.durationInSeconds,
							fps
						);
						console.log(`Calculated durationInFrames: ${durationInFrames}`);
						return {
							durationInFrames,
							props: {
								audioFile: props.audioFile,
								backgroundImage: props.backgroundImage,
							},
						};
					} catch (error) {
						console.error(`Error getting audio data: ${error}`);
						throw error;
					}
				}}
			/>
		</>
	);
};

function secondsToFrames(float: number, fps: number) {
	return Math.floor(float * fps);
}