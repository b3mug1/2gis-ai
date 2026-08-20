import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { Providers } from "./providers/Providers";

export function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
}

export default App;
