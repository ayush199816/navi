@echo off
echo Installing dependencies...

npm install @ant-design/icons @headlessui/react @heroicons/react @reduxjs/toolkit --legacy-peer-deps
if %ERRORLEVEL% NEQ 0 (
    echo Error installing @ant-design/icons, @headlessui/react, @heroicons/react, @reduxjs/toolkit
    pause
    exit /b %ERRORLEVEL%
)

npm install antd bootstrap date-fns framer-motion --legacy-peer-deps
if %ERRORLEVEL% NEQ 0 (
    echo Error installing antd, bootstrap, date-fns, framer-motion
    pause
    exit /b %ERRORLEVEL%
)

npm install html2canvas jspdf jspdf-autotable jwt-decode --legacy-peer-deps
if %ERRORLEVEL% NEQ 0 (
    echo Error installing html2canvas, jspdf, jspdf-autotable, jwt-decode
    pause
    exit /b %ERRORLEVEL%
)

npm install react-bootstrap react-datepicker redux redux-persist --legacy-peer-deps
if %ERRORLEVEL% NEQ 0 (
    echo Error installing react-bootstrap, react-datepicker, redux, redux-persist
    pause
    exit /b %ERRORLEVEL%
)

echo All dependencies installed successfully!
pause
