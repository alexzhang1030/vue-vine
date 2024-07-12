import type { LanguageServicePlugin } from '@volar/language-service'
import type { Diagnostic } from '@volar/language-server/node'
import { URI } from 'vscode-uri'
import { isVueVineVirtualCode } from '@vue-vine/language-service'
import { VLS_InfoLog, transformVineDiagnostic } from '../../language-service/src/shared'

const NOT_SHOW_VUE_VINE_MSG_TAG = [
  'volar-embedded-content',
  'volar_virtual_code',
]

export function createVineDiagnostics(): LanguageServicePlugin {
  return {
    name: 'Vue Vine Diagnostics Provider',
    capabilities: {
      diagnosticProvider: {},
    },
    create(context) {
      return {
        provideDiagnostics(document) {
          const diagnostics: Diagnostic[] = []
          const docUri = URI.parse(document.uri)
          if (
            NOT_SHOW_VUE_VINE_MSG_TAG.some(
              tag => docUri.toString().includes(tag),
            )
          ) {
            return diagnostics
          }
          const decoded = context.decodeEmbeddedDocumentUri(docUri)
          if (!decoded) {
            // Not a embedded document
            return diagnostics
          }
          VLS_InfoLog('[VueVineDiagnosticsProvider]', `document URI: ${docUri.toString()}`)
          const virtualCode = context.language.scripts
            .get(decoded[0])?.generated?.embeddedCodes
            .get(decoded[1])

          if (!virtualCode || !isVueVineVirtualCode(virtualCode)) {
            return
          }

          return diagnostics.concat([
            ...virtualCode.vineCompileErrs.map(err => transformVineDiagnostic(err, 'err')),
            ...virtualCode.vineCompileWarns.map(warn => transformVineDiagnostic(warn, 'warn')),
          ])
        },
      }
    },
  }
}