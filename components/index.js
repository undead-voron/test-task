import React from 'react';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';

const useStyles = makeStyles(theme => ({
	card: {
		display: 'flex',
		width: 151,
	},
	details: {
		display: 'flex',
		flexDirection: 'column',
	},
	content: {
		flex: '1 0 auto',
	},
	cover: {
		width: 151,
	},
	controls: {
		display: 'flex',
		alignItems: 'center',
		paddingLeft: theme.spacing(1),
		paddingBottom: theme.spacing(1),
	},
}));

export default function MediaControlCard() {
	const classes = useStyles();
	const theme = useTheme();

	return (
		<Card className={classes.card}>
			<div className={classes.details}>
				<CardContent className={classes.content}>
					<Typography component="h5" variant="h5">
						Live From Space
					</Typography>
					<Typography variant="subtitle1" color="textSecondary">
						Mac Miller
					</Typography>
				</CardContent>
				<div className={classes.controls}>
					lol
				</div>
			</div>
		</Card>
	);
}
