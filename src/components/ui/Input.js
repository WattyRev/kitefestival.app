import { css } from "../../../styled-system/css";

const Input = ({ className = '', ...props}) => {
    return <input
        className={`${className} ${css({
            background: 'white',
            border: '1px solid gray',
            borderRadius: '3px',
            display: 'block',
            width: '100%',
        })}`}
        {...props}
    />
}

export default Input;