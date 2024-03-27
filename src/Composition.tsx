import {AbsoluteFill, Img, staticFile} from 'remotion';
import {z} from 'zod';
import {zColor} from '@remotion/zod-types';

export const myCompSchema = z.object({
	titleText: z.string(),
	titleColor: zColor(),
	logoColor: zColor(),
});

export const MyComposition: React.FC<z.infer<typeof myCompSchema>> = ({}) => {
	return (
		<>
			<AbsoluteFill>
				<Img
					src={staticFile('/background.jpg')}
					className="h-full w-full object-cover object-center"
				/>
			</AbsoluteFill>

			<AbsoluteFill>
				<div className="bg-zinc-900 mx-12 my-10 h-full rounded-md shadow-2xl" />
			</AbsoluteFill>
		</>
	);
};
