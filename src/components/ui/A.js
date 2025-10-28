import { buttonStyles } from "./LinkButton";

const A = ({ className = "", ...props }) => {
    return <a className={`${className} ${buttonStyles}`} {...props} />;
};

export default A;
