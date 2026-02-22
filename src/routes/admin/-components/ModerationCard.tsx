import {
    Card,
    CardMedia,
    CardContent,
    Typography,
} from '@mui/material';
import type { ContentReport } from '../../../types';

export function ModerationCard({ report }: { report: ContentReport }) {
    return (
        <Card
            variant="outlined"
            sx={{
                bgcolor: 'background.paper',
                cursor: report.context_id ? 'pointer' : 'default',
                '&:hover': report.context_id ? { bgcolor: 'grey.50' } : {},
                overflow: 'hidden'
            }}
        >
            {!report.target_content ? (
                <CardContent>
                    <Typography variant="subtitle2" color="error.main" fontStyle="italic">
                        Content Unavailable
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        This content may have been already deleted.
                    </Typography>
                </CardContent>
            ) : (
                <>
                    {(report.target_type === 'media' || (report.target_type === 'spot' && report.target_content?.thumbnailUrl)) && (
                        <CardMedia
                            component="img"
                            height="160"
                            image={report.target_type === 'spot' ? report.target_content.thumbnailUrl : (report.target_content.thumbnail_url || report.target_content.url)}
                            alt="Content preview"
                            sx={{ objectFit: 'cover', bgcolor: 'black' }}
                        />
                    )}
                    <CardContent>
                        {report.target_type === 'spot' && (
                            <>
                                <Typography variant="subtitle1" color="primary" fontWeight={800}>
                                    {report.target_content.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {[
                                        report.target_content.address,
                                        report.target_content.city,
                                        report.target_content.state,
                                        report.target_content.country
                                    ].filter(Boolean).join(', ')}
                                </Typography>
                            </>
                        )}
                        {report.target_type === 'comment' && (
                            <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.primary' }}>
                                "{report.target_content.content}"
                            </Typography>
                        )}
                        {report.target_type === 'media' && (
                            <Typography variant="caption" color="text.secondary">
                                Media ID: {report.target_content.id}
                            </Typography>
                        )}
                    </CardContent>
                </>
            )}
        </Card>
    );
}
