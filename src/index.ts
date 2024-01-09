import { app } from "@rotorsoft/eventually";
import { ExpressApp } from "@rotorsoft/eventually-express";

app(new ExpressApp()).build();
void app().listen();
