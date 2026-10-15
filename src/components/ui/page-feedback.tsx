type PageFeedbackProps = {
	kind: 'loading' | 'error';
	message: string;
};

// request feedback.
export function PageFeedback({ kind, message }: PageFeedbackProps) {
	if (kind === 'loading') {
		return (
			<section className='loading' role='status'>
				<span className='loading__spinner' aria-hidden='true' />
				{message}
			</section>
		);
	}

	return (
		<section className='error' role='alert'>
			{message}
		</section>
	);
}
