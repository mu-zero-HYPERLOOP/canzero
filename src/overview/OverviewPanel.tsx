import {Container} from '@mui/material';
import ControlGrid from './ControlGrid.tsx';
import {NodeInformation} from "../nodes/types/NodeInformation.ts";

interface OverviewProps {
    nodes: NodeInformation[];
}
function OverviewPanel({nodes}: Readonly<OverviewProps>) {

    return (
        <div>
            <Container maxWidth="xl" sx={{mt: 0, mb: 0}}>
                <ControlGrid nodes={nodes}/>
            </Container>
        </div>

    );
}

export default OverviewPanel;
