import {AbsoluteFill, Img, staticFile} from 'remotion';
import {z} from 'zod';
import {zColor} from '@remotion/zod-types';

export const myCompSchema = z.object({
	titleText: z.string(),
	titleColor: zColor(),
	logoColor: zColor(),
});

export const MyComposition: React.FC<z.infer<typeof myCompSchema>> = ({}) => {
	const speakers = [
		{
			name: 'Adam',
			color: '#0b0b0b',
			picture: staticFile('adam.jpg'),
		},
		{
			name: 'Ian',
			color: '#342f2a',
			picture: staticFile('ian.jpg'),
		},
		{
			name: 'Aaron',
			color: '#e2ad9d',
			picture: staticFile('aaron.jpg'),
		},
	];

	return (
		<>
			<AbsoluteFill>
				<Img
					src={staticFile('/background.jpg')}
					className="h-full w-full object-cover object-center"
				/>
			</AbsoluteFill>

			<AbsoluteFill>
				<div className="bg-zinc-900 mx-12 my-10 h-full rounded-md shadow-2xl">
					<div className="grid grid-cols-3 grid-rows-1 p-4 gap-x-2 h-full">
						{speakers.map((speaker, index) => (
							<div
								key={index}
								style={{backgroundColor: speaker.color}}
								className="grid grid-rows-[1fr,auto] rounded-md"
							>
								<div className="flex justify-center items-center">
									<Img
										src={speaker.picture}
										className="size-32 rounded-full shadow-xl"
									/>
								</div>

								<div>
									<p className="px-2 py-0.5 text-white bg-zinc-900/20">
										{speaker.name}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</AbsoluteFill>
		</>
	);
};
