import Button from "@mui/material/Button";

interface GridButtonsProps {
    subscriptionActive: boolean;
    handleToggleSubscription: () => void;
}

function ButtonSection({ subscriptionActive, handleToggleSubscription }: GridButtonsProps) {
    const handleStopStartText = subscriptionActive ? "Stop" : "Start";
    const buttonColor = subscriptionActive ? "secondary" : "success";

    return (
        <div style={{ marginBottom: "10px" }}>
            <Button variant="contained" color={buttonColor} onClick={handleToggleSubscription}>
            {handleStopStartText}
            </Button>
        </div>
    );
}
export default ButtonSection;
