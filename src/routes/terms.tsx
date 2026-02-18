import { createFileRoute } from '@tanstack/react-router';
import { Container, Typography, Box, Paper, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SEO from '@/components/SEO/SEO';

export const Route = createFileRoute('/terms')({
    component: TermsComponent,
});

function TermsComponent() {
    return (
        <Container maxWidth="md" sx={{ py: 8 }}>
            <SEO
                title="Terms and Conditions"
                description="Terms and conditions for using SpotHop."
                url="/terms"
            />
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => window.history.back()}
                sx={{ mb: 4 }}
            >
                Back
            </Button>
            <Paper sx={{ p: 4, borderRadius: 1, backgroundColor: '#fafafa' }}>
                <Typography variant="h4" component="h1" fontWeight={900} gutterBottom>
                    TERMS AND CONDITIONS OF USE
                </Typography>
                <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                    EFFECTIVE DATE: FEBRUARY 13, 2026. BY ACCESSING OR USING THE SERVICES (AS DEFINED BELOW), YOU AGREE TO BE BOUND BY THESE TERMS.
                </Typography>

                <Box sx={{
                    mt: 2,
                    '& .MuiTypography-root': {
                        fontSize: '0.7rem',
                        lineHeight: 1.4,
                        textAlign: 'justify',
                        color: '#444'
                    }
                }}>
                    <Typography variant="subtitle2" fontWeight={800} gutterBottom sx={{ fontSize: '0.75rem !important' }}>
                        1. DEFINITIONS AND SCOPE
                    </Typography>
                    <Typography component="p">
                        The "Service" shall refer to the SpotHop application, inclusive of all binary distributions, web interfaces, and backend infrastructure managed by the operators of SpotHop (hereinafter "The Company," "We," "Us," or "Our"). "User" (hereinafter "You," "Your," or "Subscriber") refers to any individual or legal entity accessing the Service. These Terms constitute a legally binding agreement between You and The Company. By initializing the account registration process or by continued use of the interface, You represent and warrant that You have the legal capacity to enter into this contract and have attained the age of majority in Your jurisdiction.
                    </Typography>

                    <Typography variant="subtitle2" fontWeight={800} gutterBottom sx={{ fontSize: '0.75rem !important' }}>
                        2. USER-GENERATED CONTENT (UGC) LICENSE GRANT
                    </Typography>
                    <Typography component="p">
                        In consideration of Your use of the Service, You hereby grant to The Company and its affiliates, successors, and assigns, a non-exclusive, irrevocable, perpetual, worldwide, royalty-free, fully-paid, transferable, and sublicensable (through multiple tiers) license to use, reproduce, modify, adapt, publish, translate, create derivative works from, distribute, publicly perform, and publicly display any and all content, including but not limited to photographic images, video cinematics, spatial coordinates (metadata), textual descriptions, and comments (collectively, "Content") that You upload, post, or otherwise transmit via the Service. This license grant permits The Company to utilize said Content in any and all media formats and channels now known or hereafter devised, for any purpose whatsoever, including but not limited to commercial promotional activities, training of algorithmic models, and third-party data distribution, without further notice, attribution, or compensation to You. You waive any "moral rights" or rights of "droit moral" in the Content to the fullest extent permitted by law.
                    </Typography>

                    <Typography variant="subtitle2" fontWeight={800} gutterBottom sx={{ fontSize: '0.75rem !important' }}>
                        3. CONTENT REPRESENTATIONS AND WARRANTIES
                    </Typography>
                    <Typography component="p">
                        You represent and warrant that: (i) You are the sole and exclusive owner of the Content or have all necessary rights, licenses, consents, and releases to grant the rights granted herein; and (ii) the Content does not infringe, misappropriate, or violate a third party's intellectual property rights, rights of publicity or privacy, or result in the violation of any applicable law or regulation. You strictly agree NOT to transmit any material that is obscene, pornographic, pedophilic, invasive of another's privacy, including bodily privacy, insulting or harassing on the basis of gender, libellous, racially or ethnically objectionable, relating or encouraging money laundering or gambling, or otherwise inconsistent with or contrary to the laws in force.
                    </Typography>

                    <Typography variant="subtitle2" fontWeight={800} gutterBottom sx={{ fontSize: '0.75rem !important' }}>
                        4. INDEMNIFICATION AND ASSUMPTION OF RISK
                    </Typography>
                    <Typography paragraph sx={{ fontWeight: 600 }}>
                        YOU EXPRESSLY ACKNOWLEDGE THAT SKATEBOARDING, INLINE SKATING, AND SIMILAR ACTIVITIES ARE INHERENTLY DANGEROUS SPORTS AND ACTIVITIES IN WHICH THERE IS AN ADMITTED RISK OF SERIOUS BODILY INJURY OR DEATH. YOU AGREE THAT YOU ARE VOLUNTARILY VISITING ANY PHYSICAL LOCATIONS ("SPOTS") IDENTIFIED THROUGH THE SERVICE AND THAT YOU ASSUME ALL RISKS OF LOSS, DAMAGE, OR INJURY THAT MAY BE SUSTAINED BY YOU.
                    </Typography>
                    <Typography component="p">
                        You agree to indemnify, defend, and hold harmless The Company, its officers, directors, employees, agents, and licensors from and against all losses, expenses, damages, and costs, including reasonable attorneys' fees, resulting from any violation of these terms or any activity related to Your account (including negligent or wrongful conduct) by You or any other person accessing the Service using Your account.
                    </Typography>

                    <Typography variant="subtitle2" fontWeight={800} gutterBottom sx={{ fontSize: '0.75rem !important' }}>
                        5. DISCLAIMER OF WARRANTIES
                    </Typography>
                    <Typography component="p">
                        THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. THE COMPANY EXPRESSLY DISCLAIMS ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. THE COMPANY MAKES NO WARRANTY THAT (i) THE SERVICE WILL MEET YOUR REQUIREMENTS; (ii) THE SERVICE WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE; (iii) THE RESULTS THAT MAY BE OBTAINED FROM THE USE OF THE SERVICE WILL BE ACCURATE OR RELIABLE; OR (iv) THE QUALITY OF ANY PRODUCTS, SERVICES, INFORMATION, OR OTHER MATERIAL PURCHASED OR OBTAINED BY YOU THROUGH THE SERVICE WILL MEET YOUR EXPECTATIONS.
                    </Typography>

                    <Typography variant="subtitle2" fontWeight={800} gutterBottom sx={{ fontSize: '0.75rem !important' }}>
                        6. LIMITATION OF LIABILITY
                    </Typography>
                    <Typography component="p">
                        TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL THE COMPANY BE LIABLE FOR ANY INDIRECT, PUNITIVE, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR EXEMPLARY DAMAGES, INCLUDING WITHOUT LIMITATION DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR RELATING TO THE USE OF, OR INABILITY TO USE, THIS SERVICE. UNDER NO CIRCUMSTANCES WILL THE COMPANY BE RESPONSIBLE FOR ANY DAMAGE, LOSS OR INJURY RESULTING FROM HACKING, TAMPERING OR OTHER UNAUTHORIZED ACCESS OR USE OF THE SERVICE OR YOUR ACCOUNT OR THE INFORMATION CONTAINED THEREIN.
                    </Typography>

                    <Typography variant="subtitle2" fontWeight={800} gutterBottom sx={{ fontSize: '0.75rem !important' }}>
                        7. AUTOMATED MODERATION, TERMINATION, AND PERMANENT BANNING
                    </Typography>
                    <Typography component="p">
                        The Company employs proprietary and third-party automated processing systems to analyze Content for violations of Section 3. You acknowledge and agree that The Company reserves the unilateral, absolute, and non-reviewable right, in its sole and absolute discretion, to remove any Content, and/or to suspend, terminate, or delete any User account at any time, for any reason or no reason whatsoever, without prior notice, explanation, or liability to You. Furthermore, The Company reserves the right to implement permanent bans on individuals, IP addresses, or hardware identifiers associated with any User who violates these Terms, effectively prohibiting any future use or access to the Service by such individuals. Any attempt to circumvent a ban by creating new accounts shall constitute a material breach of this Agreement and may result in legal action. Users whose accounts are terminated or banned for any reason forfeit all rights to data recovery, content retrieval, or any form of compensation.
                    </Typography>

                    <Typography variant="subtitle2" fontWeight={800} gutterBottom sx={{ fontSize: '0.75rem !important' }}>
                        8. GOVERNING LAW AND JURISDICTION
                    </Typography>
                    <Typography component="p">
                        These Terms shall be governed by and construed in accordance with the laws of the State of New York, United States of America, without regard to its conflict of law provisions. You agree to submit to the personal and exclusive jurisdiction of the courts located within Onondaga County, New York, for the resolution of any disputes arising out of or relating to these Terms or the Service.
                    </Typography>

                    <Typography variant="subtitle2" fontWeight={800} gutterBottom sx={{ fontSize: '0.75rem !important' }}>
                        9. SEVERABILITY AND INTEGRATION
                    </Typography>
                    <Typography component="p">
                        These Terms, together with the Privacy Policy and any other legal notices published by The Company on the Service, shall constitute the entire agreement between You and The Company concerning the Service. If any provision of these Terms is deemed invalid by a court of competent jurisdiction, the invalidity of such provision shall not affect the validity of the remaining provisions of these Terms, which shall remain in full force and effect. No waiver of any term of these Terms shall be deemed a further or continuing waiver of such term or any other term.
                    </Typography>

                    <Typography variant="subtitle2" fontWeight={800} gutterBottom sx={{ fontSize: '0.75rem !important' }}>
                        10. MODIFICATION OF AGREEMENT
                    </Typography>
                    <Typography component="p">
                        The Company reserves the right to amend these Terms at any time and without notice, and it is Your responsibility to review these Terms for any changes. Your use of the Service following any amendment of these Terms will signify Your assent to and acceptance of its revised terms.
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
}
