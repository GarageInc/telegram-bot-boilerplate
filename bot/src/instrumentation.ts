// ⚠️: Keep this at the top for early error detection
import { OTEL_SERVICE_NAME, OTLP_ENDPOINT, OTEL_AUTH_TOKEN } from "./env.ts";

import * as otel from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

import { ConsoleMetricExporter, PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-node";

import pkg from "../package.json";

export let sdk: otel.NodeSDK | undefined;

// Enable OpenTelemetry instrumentation only if OTLP_ENDPOINT is set
if (OTLP_ENDPOINT) {
	console.log("Enabling OpenTelemetry instrumentation with endpoint", OTLP_ENDPOINT);

	const headers: Record<string, string> = {};
	if (OTEL_AUTH_TOKEN) headers["Authorization"] = `Bearer ${OTEL_AUTH_TOKEN}`;

	sdk = new otel.NodeSDK({
		resource: resourceFromAttributes({
			[ATTR_SERVICE_NAME]: OTEL_SERVICE_NAME,
			[ATTR_SERVICE_VERSION]: pkg.version,
		}),
		traceExporter:
			OTLP_ENDPOINT === "console"
				? new ConsoleSpanExporter()
				: new OTLPTraceExporter({
						url: `${OTLP_ENDPOINT}/v1/traces`,
						headers,
					}),
		metricReader: new PeriodicExportingMetricReader({
			exporter:
				OTLP_ENDPOINT === "console"
					? new ConsoleMetricExporter()
					: new OTLPMetricExporter({
							url: `${OTLP_ENDPOINT}/v1/metrics`,
							headers,
						}),
		}),
		instrumentations: [getNodeAutoInstrumentations()],
	});

	sdk.start();

	console.log("OpenTelemetry SDK started");
} else {
	console.log("OTLP_ENDPOINT is not set, skipping OpenTelemetry instrumentation");
}
