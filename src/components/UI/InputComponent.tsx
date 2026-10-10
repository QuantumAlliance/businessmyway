"use client";
import { Input as AntInput } from "antd"; // Renamed to AntInput
import { InputProps } from "antd/lib/input";
import { TextAreaProps } from "antd/lib/input/TextArea";
import { PasswordProps } from "antd/lib/input/Password";
import { FC } from "react";



interface InputComponentBaseProps {
  icon?: FC<{ className?: string }>;
  placeholder?: string;
  className?: string;
  type?: string;
  isPassword?: boolean;
  isTextArea?: boolean;
}

type InputComponentProps = InputComponentBaseProps & (
  | (InputProps & { isPassword?: false; isTextArea?: false })
  | (PasswordProps & { isPassword: true; isTextArea?: false })
  | (TextAreaProps & { isTextArea: true; isPassword?: false })
);

const InputComponent: FC<InputComponentProps> = ({
  icon: Icon,
  placeholder,
  className = "",
  type = "text",
  isPassword = false,
  isTextArea = false,
  ...rest
}) => {
  return (
    <div>
      {isTextArea ? (
        <AntInput.TextArea
          autoSize={{ minRows: 7, maxRows: 10 }}
          placeholder={placeholder || "Enter text"}
          className={`w-full px-4 py-3 text-[16px] text-black rounded-lg bg-transparent placeholder:text-black border border-white ${className}`}
          {...(rest as TextAreaProps)}
        />
      ) : isPassword ? (
        <AntInput.Password
          prefix={Icon && <Icon className="text-black text-xl rounded-full" />}
          placeholder={placeholder || "Enter password"}
          className={`w-full px-4 py-3 text-[16px] text-black rounded-lg bg-transparent placeholder:text-black border border-white ${className}`}
          {...(rest as PasswordProps)}
        />
      ) : (
        <AntInput
          prefix={Icon && <Icon className="text-black text-xl rounded-full" />}
          placeholder={placeholder || "Enter value"}
          className={`w-full px-4 py-3 text-[16px] text-black rounded-lg bg-transparent placeholder:text-black border border-white ${className}`}
          type={type}
          {...(rest as InputProps)}
        />
      )}
    </div>
  );
};

export default InputComponent;
