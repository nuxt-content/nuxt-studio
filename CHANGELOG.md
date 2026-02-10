# Changelog

## [1.3.1](https://github.com/nuxt-content/studio/compare/v1.2.1...v1.3.1) (2026-02-09)

## [1.2.1](https://github.com/nuxt-content/studio/compare/v1.3.0...v1.2.1) (2026-02-09)

### Bug Fixes

* **ai:** prevent meta commentary in completions and improve prompts ([ecef17e](https://github.com/nuxt-content/studio/commit/ecef17e8eeeb8169657dac7cd59d7d35be6d1ba5))

## [1.3.0](https://github.com/nuxt-content/studio/compare/v1.2.0...v1.3.0) (2026-02-09)

### Features

* **auth:** add support for Studio SSO server + env variables detection ([#320](https://github.com/nuxt-content/nuxt-studio/issues/320)) ([53d9764](https://github.com/nuxt-content/nuxt-studio/commit/53d9764d74f9ad35e756b66cead2946a4194d5b3))
* **editor:** ai completion speed improvements ([#322](https://github.com/nuxt-content/nuxt-studio/issues/322)) ([0ae35dc](https://github.com/nuxt-content/nuxt-studio/commit/0ae35dcfc31046879303037bd18a4ded983b9476))
* **editor:** ai powered content extension ([#305](https://github.com/nuxt-content/nuxt-studio/issues/305)) ([8aba1f4](https://github.com/nuxt-content/nuxt-studio/commit/8aba1f44846c39f98622b3505f6dc956541561bb))
* **i18n:** Add Bengali (bn) and Thai (th) locales ([#297](https://github.com/nuxt-content/nuxt-studio/issues/297)) ([dde8866](https://github.com/nuxt-content/nuxt-studio/commit/dde88661d36f16af6fb777790c758d1f494fde5f))
* **i18n:** Add Khmer (km) locale ([#309](https://github.com/nuxt-content/nuxt-studio/issues/309)) ([ced73f1](https://github.com/nuxt-content/nuxt-studio/commit/ced73f1ae8eed10e0df947acccc4d04ff18dc156))

### Bug Fixes

* **ai:** multiple improvements ([2a799be](https://github.com/nuxt-content/nuxt-studio/commit/2a799be956279f9bc68a6e3a9f3bd122f675ac82))
* **app:** do not expose variable from app ([0ed82ad](https://github.com/nuxt-content/nuxt-studio/commit/0ed82ad9561d2e12f21666204e62b9ebbe87b52c))
* **files:** sanitize names to prevent unintended directory creation ([#312](https://github.com/nuxt-content/nuxt-studio/issues/312)) ([c131d77](https://github.com/nuxt-content/nuxt-studio/commit/c131d77f30403e2ffdbbc70b5df74b5a820f22c4))
* **sso:** enforce PKCE + move the server utils to correct dir ([#323](https://github.com/nuxt-content/nuxt-studio/issues/323)) ([b2dc60d](https://github.com/nuxt-content/nuxt-studio/commit/b2dc60da534b664406efefa6490914cbd26b43e9))
* **state:** active local storage ([acf1a9a](https://github.com/nuxt-content/nuxt-studio/commit/acf1a9a67b60e7029e5d0b86a8c41185edcab610))
* **types:** server ai location ([5f81a2a](https://github.com/nuxt-content/nuxt-studio/commit/5f81a2a10efb332dc3ac563b720486b6e53e2e77))

## [1.2.0](https://github.com/nuxt-content/nuxt-studio/compare/v1.1.1...v1.2.0) (2026-01-23)

### Features

* **editor:** custom image extension ([#294](https://github.com/nuxt-content/nuxt-studio/issues/294)) ([6ca0818](https://github.com/nuxt-content/nuxt-studio/commit/6ca0818111e7213760941029c48d0fb0cfd9637a))
* **editor:** custom video extension ([#300](https://github.com/nuxt-content/nuxt-studio/issues/300)) ([d05ac37](https://github.com/nuxt-content/nuxt-studio/commit/d05ac378c7cfa857a5285c703b2aa22b8b942a23))

### Bug Fixes

* **editor:** duplicated boolean props ([#299](https://github.com/nuxt-content/nuxt-studio/issues/299)) ([ff99c64](https://github.com/nuxt-content/nuxt-studio/commit/ff99c64f66d2504376dc35f74b80323ef285f320))
* **editor:** separate classes by dots ([#301](https://github.com/nuxt-content/nuxt-studio/issues/301)) ([be0a4d2](https://github.com/nuxt-content/nuxt-studio/commit/be0a4d21e9b42cc468b2c4ed0b8262d6c5e4de89))
* **ItemCardForm:** ensure fsPath has no leading path ([55eddac](https://github.com/nuxt-content/nuxt-studio/commit/55eddac614904322875a4de9d0a6b7c98fd5289b))
* **lint:** no any ([d14b94b](https://github.com/nuxt-content/nuxt-studio/commit/d14b94bbc6a15329438b61574d762e3a80fcd4e2))
* **state:** create custom shared composable ([3ff2a1f](https://github.com/nuxt-content/nuxt-studio/commit/3ff2a1fc6737bfcf469fda8db6cedabfa72eeaf3))
* **tree:** sort items numerically by prefix then name ([#293](https://github.com/nuxt-content/nuxt-studio/issues/293)) ([7ceacde](https://github.com/nuxt-content/nuxt-studio/commit/7ceacde9ee445b48492c7e03da872ed8f2773c48))

## [1.1.1](https://github.com/nuxt-content/nuxt-studio/compare/v1.1.0...v1.1.1) (2026-01-19)

### Bug Fixes

* **auth:** studio cookie handling ([#284](https://github.com/nuxt-content/nuxt-studio/issues/284)) ([4df7f56](https://github.com/nuxt-content/nuxt-studio/commit/4df7f56e97796713c7d74fbcb0f980a07e1bc5b3))
* **ItemCardForm:** do not slugify whole path ([#290](https://github.com/nuxt-content/nuxt-studio/issues/290)) ([fab454f](https://github.com/nuxt-content/nuxt-studio/commit/fab454f957c5c0e2faa1bd1207639822f738dd4c))
* **source:** replace prefix without leading slash ([#291](https://github.com/nuxt-content/nuxt-studio/issues/291)) ([81450ab](https://github.com/nuxt-content/nuxt-studio/commit/81450ab9e1f7132819e4cd086ee6c24110c9b7a8))

## [1.1.0](https://github.com/nuxt-content/nuxt-studio/compare/v1.0.0...v1.1.0) (2026-01-14)

### Features

* ** editor:** add textarea input in form editor ([#264](https://github.com/nuxt-content/nuxt-studio/issues/264)) ([d20a7c4](https://github.com/nuxt-content/nuxt-studio/commit/d20a7c456f6e9bb05dcf91f6d790a8d2eb294f9d))
* **auth:** add login and logout server runtime hooks ([#263](https://github.com/nuxt-content/nuxt-studio/issues/263)) ([3b98f54](https://github.com/nuxt-content/nuxt-studio/commit/3b98f54e892df2e3de47ad9a0b0cd4a9a5f9bf0e))
* **editor:** support datetime input + fix date input ([#234](https://github.com/nuxt-content/nuxt-studio/issues/234)) ([67f659c](https://github.com/nuxt-content/nuxt-studio/commit/67f659cff12757f2e4c424a1a60b49674bb21d8e))
* **form:** detect potential media/icon selection + improve object inputs ([#255](https://github.com/nuxt-content/nuxt-studio/issues/255)) ([de38ed8](https://github.com/nuxt-content/nuxt-studio/commit/de38ed8353827939e1d54ccb67917f276fa1e3dd))
* **frontmatter:** remove hidden fields before passing document to studio editor ([#254](https://github.com/nuxt-content/nuxt-studio/issues/254)) ([b0f0827](https://github.com/nuxt-content/nuxt-studio/commit/b0f08270fed24307ed3a234fae910bdf4a328306))
* **i18n:** add Kurdish (ckb) locale ([#270](https://github.com/nuxt-content/nuxt-studio/issues/270)) ([ac15b8c](https://github.com/nuxt-content/nuxt-studio/commit/ac15b8c00239be8f0d7e2c3ff1de0613ac84fbbd))
* **i18n:** add Vietnamese (vi) locale ([#256](https://github.com/nuxt-content/nuxt-studio/issues/256)) ([399e465](https://github.com/nuxt-content/nuxt-studio/commit/399e465edeba67156b19d61296e1e8f853380034))
* **meta:** add component filtering in editor ([#260](https://github.com/nuxt-content/nuxt-studio/issues/260)) ([185ab76](https://github.com/nuxt-content/nuxt-studio/commit/185ab76b1809c402ff2b2b422d01776839adcb0f))
* **tiptap:** add insertion actions to drag actions ([#246](https://github.com/nuxt-content/nuxt-studio/issues/246)) ([c33a2dd](https://github.com/nuxt-content/nuxt-studio/commit/c33a2dde6601a5cd7e03412f24f1abc88c5f8c62))

### Bug Fixes

* **app:** reduce z-index to let other modal show over it ([#238](https://github.com/nuxt-content/nuxt-studio/issues/238)) ([a740855](https://github.com/nuxt-content/nuxt-studio/commit/a740855cc04afa71d6909dea51e78404859af121))
* **collection:** handle collection prefix ([#242](https://github.com/nuxt-content/nuxt-studio/issues/242)) ([d09d54e](https://github.com/nuxt-content/nuxt-studio/commit/d09d54e1295a97f6232fbcaf38b0a369234a5419))
* **document:** respect `contentHeading` option ([#215](https://github.com/nuxt-content/nuxt-studio/issues/215)) ([ca79f02](https://github.com/nuxt-content/nuxt-studio/commit/ca79f028d52666726ee16f6b4972641721da8d17))
* **form:** arrays edition ([#257](https://github.com/nuxt-content/nuxt-studio/issues/257)) ([e10ed37](https://github.com/nuxt-content/nuxt-studio/commit/e10ed37c95a14123cdc0cb546fc70d6a83eabcb7))
* **itemCardForm:** slugify file path ([#228](https://github.com/nuxt-content/nuxt-studio/issues/228)) ([830fc03](https://github.com/nuxt-content/nuxt-studio/commit/830fc03ec9a69d5c9b695d33d9302556dbf2a49a))
* **tiptapToMdc:** unwrap paragraphs inside slot ([#247](https://github.com/nuxt-content/nuxt-studio/issues/247)) ([a7a0d92](https://github.com/nuxt-content/nuxt-studio/commit/a7a0d929e6a2076cceb9acb77d886d5662f124af))

## [1.0.0](https://github.com/nuxt-content/nuxt-studio/compare/v1.0.0-beta.3...v1.0.0) (2026-01-05)

### Features

* **i18n:** add Czech (cs) locale ([#223](https://github.com/nuxt-content/nuxt-studio/issues/223)) ([b803597](https://github.com/nuxt-content/nuxt-studio/commit/b8035971e8d623e38d3f883e90324a36841cde0f))
* **i18n:** add Korean (ko) locale ([#220](https://github.com/nuxt-content/nuxt-studio/issues/220)) ([92fec9e](https://github.com/nuxt-content/nuxt-studio/commit/92fec9e8cc1c03e5320008b41f71dd66021f007e))
* **i18n:** add Russian (ru) locale ([#216](https://github.com/nuxt-content/nuxt-studio/issues/216)) ([b97e352](https://github.com/nuxt-content/nuxt-studio/commit/b97e3523d92e543cdf6df818119f0290a2ddad83))
* **i18n:** define locale in`UApp` ([#225](https://github.com/nuxt-content/nuxt-studio/issues/225)) ([a761b26](https://github.com/nuxt-content/nuxt-studio/commit/a761b265c67403cac59d71492e8ba3ee236fe88b))

## [1.0.0-beta.3](https://github.com/nuxt-content/nuxt-studio/compare/v1.0.0-beta.2...v1.0.0-beta.3) (2025-12-24)

### Features

* **editor:** handle custom inputs based on types ([#214](https://github.com/nuxt-content/nuxt-studio/issues/214)) ([a411216](https://github.com/nuxt-content/nuxt-studio/commit/a411216aba1f462ff42d214fd1860a4c4f1d020b))

### Bug Fixes

* **file:** json/yaml content on create ([#213](https://github.com/nuxt-content/nuxt-studio/issues/213)) ([230e31e](https://github.com/nuxt-content/nuxt-studio/commit/230e31ee2373cb17ab1e46532bfa3b969aa8a581))

## [1.0.0-beta.2](https://github.com/nuxt-content/nuxt-studio/compare/v1.0.0-beta.1...v1.0.0-beta.2) (2025-12-23)

### Features

* **editor:** binding extension ([#201](https://github.com/nuxt-content/nuxt-studio/issues/201)) ([29632e1](https://github.com/nuxt-content/nuxt-studio/commit/29632e1cb2d4021d6aa10f01260a25d86d7134ea))
* **editor:** handle props edition for components ([#195](https://github.com/nuxt-content/nuxt-studio/issues/195)) ([8819fe9](https://github.com/nuxt-content/nuxt-studio/commit/8819fe9c81e4291e973be6a2f983dcc3b48f9d1f))
* **editor:** handle span-style feature with toolbar button ([#193](https://github.com/nuxt-content/nuxt-studio/issues/193)) ([5498cf7](https://github.com/nuxt-content/nuxt-studio/commit/5498cf76a0ea8242fbfb2f7762ef620ddc94ef6e))
* **gitlab:** normalize instance URL by removing trailing slashes ([#190](https://github.com/nuxt-content/nuxt-studio/issues/190)) ([ae29291](https://github.com/nuxt-content/nuxt-studio/commit/ae2929174b07905dc20855c513f0f7c12d2c3ca4))
* **i18n:** add Chinese Traditional (zh-tw) locale ([#199](https://github.com/nuxt-content/nuxt-studio/issues/199)) ([bbe9b9a](https://github.com/nuxt-content/nuxt-studio/commit/bbe9b9a6330540377c08de919e188c97aaa78e4c))

### Bug Fixes

* **auth:** remove build error message with git token for custom auth ([#200](https://github.com/nuxt-content/nuxt-studio/issues/200)) ([fed5a5d](https://github.com/nuxt-content/nuxt-studio/commit/fed5a5dbf4a7e5722803903c417987062ed89de8))
* **git:** use PAT owner as main authors + add co-authors ([#203](https://github.com/nuxt-content/nuxt-studio/issues/203)) ([ff78007](https://github.com/nuxt-content/nuxt-studio/commit/ff780079b863e7ad3a3f8897d139b5c1102ffae3))
* **i18n:** typo in polish translation ([#204](https://github.com/nuxt-content/nuxt-studio/issues/204)) ([bd89373](https://github.com/nuxt-content/nuxt-studio/commit/bd893739d574b74198b8ecda16731d0b3e586705))
* **types:** useless ts error comment ([3371f8b](https://github.com/nuxt-content/nuxt-studio/commit/3371f8be03430e0acd239720c15d64270797d3ce))

## [1.0.0-beta.1](///compare/v1.0.0-beta.0...v1.0.0-beta.1) (2025-12-18)

### Features

* **auth:** provide utility for custom authentication ([#181](undefined/undefined/undefined/issues/181)) 3e1b64f
* **i18n:** add Norwegian (nb-no) locale ([#187](undefined/undefined/undefined/issues/187)) f8fcb7b
* **i18n:** add Norwegian Nynorsk (nn-no) translation ([#188](undefined/undefined/undefined/issues/188)) c59a26c

### Bug Fixes

* **sidebar:** apply left margin style to fixed elements ([#189](undefined/undefined/undefined/issues/189)) 6e97ce8

## [1.0.0-beta.0](///compare/v1.0.0-alpha.4...v1.0.0-beta.0) (2025-12-16)

### Features

* **editor:** emoji integration ([#171](undefined/undefined/undefined/issues/171)) c4d0655
* **editor:** form editor for YAML/JSON and frontmatter ([#178](undefined/undefined/undefined/issues/178)) 9aa2a8d
* **editor:** upload and display video ([#162](undefined/undefined/undefined/issues/162)) 594a5b0
* **i18n:** add Arabic (ar) locale ([#168](undefined/undefined/undefined/issues/168)) b50f513
* **i18n:** add Ukrainian (ua) locale ([#177](undefined/undefined/undefined/issues/177)) 2b4ee9a
* **media:** add AVIF to the supported image file types ([#174](undefined/undefined/undefined/issues/174)) d3d0e6c
* **state:** set tiptap editor mode as default 3cf5541

### Bug Fixes

* **document:** avoid page fields for data types ([#173](undefined/undefined/undefined/issues/173)) ca77b97
* **document:** do not apply `page` meta information in `data` collections ([#167](undefined/undefined/undefined/issues/167)) a607691
* **document:** ignore empty lines in compare ([#169](undefined/undefined/undefined/issues/169)) 0453f4e
* **editor:** relative links must no be targetted as _blank ([#170](undefined/undefined/undefined/issues/170)) 8d18ec7
* **module:** optimize debug and extend as deps of nuxt studio ([#175](undefined/undefined/undefined/issues/175)) eb5334e

## [1.0.0-alpha.4](https://github.com/nuxt-content/nuxt-studio/compare/v1.0.0-alpha.3...v1.0.0-alpha.4) (2025-12-10)

### Features

* **auth:** Google OAuth ([#146](https://github.com/nuxt-content/nuxt-studio/issues/146)) ([e068543](https://github.com/nuxt-content/nuxt-studio/commit/e068543fd2010143ef9d17aa98c3efcf9b5e776b))
* **i18n:** add Dutch (nl) locale ([#150](https://github.com/nuxt-content/nuxt-studio/issues/150)) ([c9a11ba](https://github.com/nuxt-content/nuxt-studio/commit/c9a11babaa883871314e1bfcba9a97250ef0fd21))
* **i18n:** add Finnish (fi) locale ([#157](https://github.com/nuxt-content/nuxt-studio/issues/157)) ([0a1d2d4](https://github.com/nuxt-content/nuxt-studio/commit/0a1d2d4567afc8a880642a8bc32e05d78292b6b3))
* **i18n:** add Japanese (ja) locale ([#147](https://github.com/nuxt-content/nuxt-studio/issues/147)) ([fa0164e](https://github.com/nuxt-content/nuxt-studio/commit/fa0164eed7079058de5ead387b955ca09c80a40c))
* **i18n:** Add translations to TipTap editor UI ([#148](https://github.com/nuxt-content/nuxt-studio/issues/148)) ([74a798e](https://github.com/nuxt-content/nuxt-studio/commit/74a798e3aedc1aa134dfb88cadd9ba97b6749263))
* **i18n:** improve Bulgarian (bg) translations ([#154](https://github.com/nuxt-content/nuxt-studio/issues/154)) ([4634e9c](https://github.com/nuxt-content/nuxt-studio/commit/4634e9ce988bc55d76a14db273f0e8b71735596e))
* **preview:** use highlight options from `@nuxtjs/mdc` to highlight code snippets ([#158](https://github.com/nuxt-content/nuxt-studio/issues/158)) ([55bedd4](https://github.com/nuxt-content/nuxt-studio/commit/55bedd4cd714f78e5fc786eca4f6a4c9035a4b09))

### Bug Fixes

* **auth:** improve OAuth state token validation ([#160](https://github.com/nuxt-content/nuxt-studio/issues/160)) ([9992865](https://github.com/nuxt-content/nuxt-studio/commit/9992865929e7493981abccfe4cd45b1e54c2fb2d))
* **auth:** only display detected provider on `_studio` page ([98e0fd2](https://github.com/nuxt-content/nuxt-studio/commit/98e0fd2a66d797ac9887169f8c187ea3e30bfa5b))
* **editor:** handle markdown files as `data` collection ([#153](https://github.com/nuxt-content/nuxt-studio/issues/153)) ([511b2f5](https://github.com/nuxt-content/nuxt-studio/commit/511b2f5fedab647c166921aefb3b2b8044a9802c))
* **item:** do not close form on extension selection ([#161](https://github.com/nuxt-content/nuxt-studio/issues/161)) ([9f17b4f](https://github.com/nuxt-content/nuxt-studio/commit/9f17b4f7e2bd3ea63a603ca1633a4048c10fdbf2))
* **item:** do not unset action in progress on extension selection ([#155](https://github.com/nuxt-content/nuxt-studio/issues/155)) ([b54b0dd](https://github.com/nuxt-content/nuxt-studio/commit/b54b0ddec09a55d9a7dfbed17cc4e05f3c754a68))
* **preferences:** resolve double-toggle event conflict on debug switch ([#166](https://github.com/nuxt-content/nuxt-studio/issues/166)) ([c5b69ed](https://github.com/nuxt-content/nuxt-studio/commit/c5b69ed5fd49e0d63417d8e06c59bc1dfca956ac))
* **sw:** unregister on sign out ([#164](https://github.com/nuxt-content/nuxt-studio/issues/164)) ([b261da9](https://github.com/nuxt-content/nuxt-studio/commit/b261da9b3fb4bb83f1db62d2d352e8ce9afe8991))
* **tree:** autfocus input on creation ([b1e5ac3](https://github.com/nuxt-content/nuxt-studio/commit/b1e5ac3771686bd1779090cef32caa230a845799))

## [1.0.0-alpha.3](https://github.com/nuxt-content/nuxt-studio/compare/v1.0.0-alpha.2...v1.0.0-alpha.3) (2025-12-03)

### Features

* **actions:** use ellipsis in toolbar + add git repo ([#120](https://github.com/nuxt-content/nuxt-studio/issues/120)) ([7e1ab68](https://github.com/nuxt-content/nuxt-studio/commit/7e1ab683dab914ecc68f8b9bedbfc634e27e5895))
* **editor:** tiptap integration with Nuxt UI Editor ([#125](https://github.com/nuxt-content/nuxt-studio/issues/125)) ([420791d](https://github.com/nuxt-content/nuxt-studio/commit/420791db9a4e35e0dcecf55f01a67d7f0764e0b6))
* **i18n:** add Bulgarian (bg) locales ([#121](https://github.com/nuxt-content/nuxt-studio/issues/121)) ([ada76a7](https://github.com/nuxt-content/nuxt-studio/commit/ada76a7bbef948324c7eb9a1f60d5b261152b300))
* **i18n:** add Chinese (zh) locale ([#143](https://github.com/nuxt-content/nuxt-studio/issues/143)) ([77a2848](https://github.com/nuxt-content/nuxt-studio/commit/77a28481782c3b18f15c0ccc6dae65a090619dac))
* **i18n:** add Farsi (fa) locale ([#134](https://github.com/nuxt-content/nuxt-studio/issues/134)) ([75d9494](https://github.com/nuxt-content/nuxt-studio/commit/75d9494053dd8690a2e7ab4c831264dab437dd29))
* **i18n:** add German (de) locale ([#119](https://github.com/nuxt-content/nuxt-studio/issues/119)) ([1ac2d5e](https://github.com/nuxt-content/nuxt-studio/commit/1ac2d5ee005947207f33cd8cd97a8f3df486dd16))
* **i18n:** add Italian (it) locale ([#142](https://github.com/nuxt-content/nuxt-studio/issues/142)) ([1ed9622](https://github.com/nuxt-content/nuxt-studio/commit/1ed9622e1e70f174e4584343a495ddd439e3f1a7))
* **i18n:** add Polish (pl) locales ([#124](https://github.com/nuxt-content/nuxt-studio/issues/124)) ([2d95889](https://github.com/nuxt-content/nuxt-studio/commit/2d958898922b487f92dfbe93e89254759dd798a8))
* **i18n:** Add Portuguese Brazil (pt-br) locales ([#138](https://github.com/nuxt-content/nuxt-studio/issues/138)) ([a936cf2](https://github.com/nuxt-content/nuxt-studio/commit/a936cf24aa8f6ae3fee43b1a03f83699589099bd))
* **i18n:** add spanish (es) locale ([#123](https://github.com/nuxt-content/nuxt-studio/issues/123)) ([e28bd6a](https://github.com/nuxt-content/nuxt-studio/commit/e28bd6a81063fe02e8791523cbd203b9b16c157c))
* **i18n:** Footer dev mode text + Edit Page button ([#108](https://github.com/nuxt-content/nuxt-studio/issues/108)) ([0ee6023](https://github.com/nuxt-content/nuxt-studio/commit/0ee60233c890616494d69b699ec4d440fbaec74b))
* **locales:** add Indonesian (id) locale ([#141](https://github.com/nuxt-content/nuxt-studio/issues/141)) ([3e49d2b](https://github.com/nuxt-content/nuxt-studio/commit/3e49d2bd4007166b95feca76a8bdcb662ac51497))

### Bug Fixes

* **dev:** service-worker and dev api timeout ([#145](https://github.com/nuxt-content/nuxt-studio/issues/145)) ([ae2717a](https://github.com/nuxt-content/nuxt-studio/commit/ae2717a8efecf02c46ad23db87cc0264c0a8e9cc))
* **editor:** data type edition ([#117](https://github.com/nuxt-content/nuxt-studio/issues/117)) ([93fe90c](https://github.com/nuxt-content/nuxt-studio/commit/93fe90c2c3e785a93f01e4ba581ff5088fa0eca9))
* improve document equality check ([2850168](https://github.com/nuxt-content/nuxt-studio/commit/28501684a6efa42d1be0e9f15ecf9b1c81263786))

## [1.0.0-alpha.2](https://github.com/nuxt-content/nuxt-studio/compare/v1.0.0-alpha.1...v1.0.0-alpha.2) (2025-11-17)

### Features

* **app:** add internationalization (i18n) support ([#70](https://github.com/nuxt-content/nuxt-studio/issues/70)) ([5d2099c](https://github.com/nuxt-content/nuxt-studio/commit/5d2099c5a95d865fb55c1e82a50721a8eeebdd25))
* **dev:** enable studio in development mode without auth ([#94](https://github.com/nuxt-content/nuxt-studio/issues/94)) ([953c364](https://github.com/nuxt-content/nuxt-studio/commit/953c3647d63812581a724a8f4d60bcc58f395a5d))
* **github:** allow defining custom redirect_url ([#52](https://github.com/nuxt-content/nuxt-studio/issues/52)) ([1d249a3](https://github.com/nuxt-content/nuxt-studio/commit/1d249a33bcf05ee44a387c7b89ffdf3d38087662))
* **i18n:** diff toggle button in MDC alert ([#106](https://github.com/nuxt-content/nuxt-studio/issues/106)) ([5ee50fe](https://github.com/nuxt-content/nuxt-studio/commit/5ee50fe27862759d28dc15ebbb5d213043e316d9))
* **i18n:** internationalize Monaco completion snippets ([#102](https://github.com/nuxt-content/nuxt-studio/issues/102)) ([044cb07](https://github.com/nuxt-content/nuxt-studio/commit/044cb0739b55c74b0c8357c434468df96a7ef2e0))
* **oauth:** add `repository.private` option for public repos ([#49](https://github.com/nuxt-content/nuxt-studio/issues/49)) ([5a40a43](https://github.com/nuxt-content/nuxt-studio/commit/5a40a430694b6780fdc8fee9b7845fcae0e851d3))
* **oauth:** gitlab support ([#72](https://github.com/nuxt-content/nuxt-studio/issues/72)) ([43106e7](https://github.com/nuxt-content/nuxt-studio/commit/43106e73bd3da6b3ea20c5318333850a7ffc99d0))
* **review:** ability to resize review card editor ([#66](https://github.com/nuxt-content/nuxt-studio/issues/66)) ([9161170](https://github.com/nuxt-content/nuxt-studio/commit/9161170cf771228bb2d636352f9d7af2234fe26f))

### Bug Fixes

* **app:** only navigate to treeitems with routePath ([#74](https://github.com/nuxt-content/nuxt-studio/issues/74)) ([ba7ce0b](https://github.com/nuxt-content/nuxt-studio/commit/ba7ce0b797a33645ed6fb36fdae044057cfcac90))
* **app:** use local element to render overlay elements ([#86](https://github.com/nuxt-content/nuxt-studio/issues/86)) ([136d1cd](https://github.com/nuxt-content/nuxt-studio/commit/136d1cd56fe69f3ad5e635165d0d552cf24bde1e))
* **content:** handle item prefix as string ([#93](https://github.com/nuxt-content/nuxt-studio/issues/93)) ([75f56ad](https://github.com/nuxt-content/nuxt-studio/commit/75f56ad660ed758bc4f5a7087e8d6055169f47c1))
* **dev:** load development host on dev mode ([#107](https://github.com/nuxt-content/nuxt-studio/issues/107)) ([6dac3e3](https://github.com/nuxt-content/nuxt-studio/commit/6dac3e39c49fa4c3db699bd2fbca8ed85e8a42f2))
* **dev:** remove unnecessary utils import ([#73](https://github.com/nuxt-content/nuxt-studio/issues/73)) ([93eb23b](https://github.com/nuxt-content/nuxt-studio/commit/93eb23bbaa5efe2f1f4b8801862d33602ee84e1d))
* **editor:** create portal for monaco overflow widgets ([#67](https://github.com/nuxt-content/nuxt-studio/issues/67)) ([1a5e48b](https://github.com/nuxt-content/nuxt-studio/commit/1a5e48bb78b6c53ca9a54e4c47a1e96a6e3a4814))
* **editor:** prevent indefinite editor resizing ([#62](https://github.com/nuxt-content/nuxt-studio/issues/62)) ([48b03b1](https://github.com/nuxt-content/nuxt-studio/commit/48b03b1dec8f017accce459aeb6246ef8d1f43ac))
* **editor:** watch for colorMode change on diff-editor ([#64](https://github.com/nuxt-content/nuxt-studio/issues/64)) ([a2d0a13](https://github.com/nuxt-content/nuxt-studio/commit/a2d0a13bee94cb495ca22d51029a30445947ce00))
* **i18n:** add missing trad ([8351e61](https://github.com/nuxt-content/nuxt-studio/commit/8351e61a739f71cf537314be754d2b37e1526c6a))
* **module:** ignore leading slash on source prefix check ([554218a](https://github.com/nuxt-content/nuxt-studio/commit/554218a528bc2d97ee1bdcb1f20d5406c99cf539))
* **studio:** prevent mixing active files between media and content pages ([#63](https://github.com/nuxt-content/nuxt-studio/issues/63)) ([b82cf7a](https://github.com/nuxt-content/nuxt-studio/commit/b82cf7ad45be99d3a8c828b239557325219a68ea))
* **styles:** improve dark mode text contrast ([#101](https://github.com/nuxt-content/nuxt-studio/issues/101)) ([1f2e861](https://github.com/nuxt-content/nuxt-studio/commit/1f2e861e5ef49ca30a8de866fc78bf971476bef2))
* **success:** wording space ([79ed12b](https://github.com/nuxt-content/nuxt-studio/commit/79ed12b6a7262c31392558b1bc7c056992d7a7ec))

### Performance Improvements

* **module:** do not call api on every visit for session validation ([#96](https://github.com/nuxt-content/nuxt-studio/issues/96)) ([b9eb292](https://github.com/nuxt-content/nuxt-studio/commit/b9eb292b8a534a1c97758d911ca8a8587e0d04cb))

## [1.0.0-alpha.1](https://github.com/nuxt-content/nuxt-studio/compare/v1.0.0-alpha.0...v1.0.0-alpha.1) (2025-11-05)

### Features

* add support for redirect query parameter ([0d77460](https://github.com/nuxt-content/nuxt-studio/commit/0d77460675ccb26bf0cce84e10e8522a54a6c924))

### Bug Fixes

* **app:** edit this page button ([392d1d3](https://github.com/nuxt-content/nuxt-studio/commit/392d1d387ffa7beb4c071d58c6df93205ce5be2c))
* **deps:** rollback unstorage to previous patch ([5aa09f9](https://github.com/nuxt-content/nuxt-studio/commit/5aa09f9ac26b53ef68cef5be698fa2b53d58f3ac))
* **diff:** compare date values with timestamp ([#46](https://github.com/nuxt-content/nuxt-studio/issues/46)) ([5be5e03](https://github.com/nuxt-content/nuxt-studio/commit/5be5e0322f3fd8b1092df689e5aaa8e7122f19eb))
* fallback to user login ([c74b1dd](https://github.com/nuxt-content/nuxt-studio/commit/c74b1dd0595ebaf4a5de5d7b1a10decc79bc376a))
* service worker auto install ([dc7ddb6](https://github.com/nuxt-content/nuxt-studio/commit/dc7ddb682b8e188b7056a1b9f47b6f0cb0e2d9c8))
* **service-worker:** handle vercel images ([#48](https://github.com/nuxt-content/nuxt-studio/issues/48)) ([22ae221](https://github.com/nuxt-content/nuxt-studio/commit/22ae22179e8afcd0f57c8708a583bcb13143d3cc))

## 1.0.0-alpha.0 (2025-11-04)

### Features

* **actions:** handle loading state for deletion ([3d9e1dd](https://github.com/nuxt-content/nuxt-studio/commit/3d9e1dd2720032f4d589e723251bc2c5672aa150))
* **actions:** rename folder and fix medias ([#31](https://github.com/nuxt-content/nuxt-studio/issues/31)) ([78b89f3](https://github.com/nuxt-content/nuxt-studio/commit/78b89f311bd8e525be13e80fb2d2250f6063549c))
* **actions:** revert directory ([221f84f](https://github.com/nuxt-content/nuxt-studio/commit/221f84fc6d94b8a5ff4ee94a73b8217951a8bded))
* **app:** big refactor for great UX ([#22](https://github.com/nuxt-content/nuxt-studio/issues/22)) ([791af4c](https://github.com/nuxt-content/nuxt-studio/commit/791af4c7a24637059922712f417f4d26b7bea8a0))
* **app:** enable manifest and detect new deployment ([32505ad](https://github.com/nuxt-content/nuxt-studio/commit/32505adb7d9e8e559c053ae3de3640f66ab1e907))
* **app:** keep location state ([67c4827](https://github.com/nuxt-content/nuxt-studio/commit/67c4827866410d08adfb786529b9c381dd9ba901))
* **content:** display warning if automatic parsing detected ([5878b7e](https://github.com/nuxt-content/nuxt-studio/commit/5878b7e8f6fbca16f58e832186fd194ad81e6cd2))
* **content:** files actions ([#9](https://github.com/nuxt-content/nuxt-studio/issues/9)) ([0b4a4b3](https://github.com/nuxt-content/nuxt-studio/commit/0b4a4b3df7d0771d0df47d96f5b34a3188c50094))
* **content:** integrate `modern-monaco` for file edition ([#7](https://github.com/nuxt-content/nuxt-studio/issues/7)) ([efa2f10](https://github.com/nuxt-content/nuxt-studio/commit/efa2f1075a823b7f995acd46f69991aaae762a58))
* **content:** refactor and revert action ([#13](https://github.com/nuxt-content/nuxt-studio/issues/13)) ([40efbc2](https://github.com/nuxt-content/nuxt-studio/commit/40efbc261cb363ddf5a17c200a9c118a9718bdf4))
* **content:** set status in tree directories ([a363249](https://github.com/nuxt-content/nuxt-studio/commit/a36324984ba8802510ff2b6e8f11fa46b8b067d5))
* **content:** show document sync and edit this page button ([#16](https://github.com/nuxt-content/nuxt-studio/issues/16)) ([301fc20](https://github.com/nuxt-content/nuxt-studio/commit/301fc201515938e80764e23f126ba27a1c7371c4))
* **context:** create folder action ([#25](https://github.com/nuxt-content/nuxt-studio/issues/25)) ([59c57d8](https://github.com/nuxt-content/nuxt-studio/commit/59c57d826ea3549a698ff5ad9c3c2e67ab7b12d4))
* **context:** delete actions ([#19](https://github.com/nuxt-content/nuxt-studio/issues/19)) ([9ad324d](https://github.com/nuxt-content/nuxt-studio/commit/9ad324d5c3c4541abc1e117b21d7c8acd4aec38a))
* **context:** duplicate and rename ([#23](https://github.com/nuxt-content/nuxt-studio/issues/23)) ([aed8a2d](https://github.com/nuxt-content/nuxt-studio/commit/aed8a2d3b8f9d36f35a95535636b05fb34f24f4b))
* development web component ([11d629f](https://github.com/nuxt-content/nuxt-studio/commit/11d629f553405845118019c39be7c2b05f31b58e))
* **dev:** sync with file-system in development mode ([#32](https://github.com/nuxt-content/nuxt-studio/issues/32)) ([223023f](https://github.com/nuxt-content/nuxt-studio/commit/223023f6936c4c3ee85d6185bc5b2d75e3f8d79e))
* **editor:** components suggestions inside monaco ([#21](https://github.com/nuxt-content/nuxt-studio/issues/21)) ([8e93bea](https://github.com/nuxt-content/nuxt-studio/commit/8e93bea48a1ef1b03a0e74324ccd87958643859f))
* **git:** commit files to Github ([#20](https://github.com/nuxt-content/nuxt-studio/issues/20)) ([2c9b969](https://github.com/nuxt-content/nuxt-studio/commit/2c9b969990abcc3fd5a37dc8711a1eee7e13d37f))
* **github:** handle conflict on file ([0b0aa4c](https://github.com/nuxt-content/nuxt-studio/commit/0b0aa4c6e8493409788e1da76e07b3f5eb70b982))
* **host:** file system storage in development ([#10](https://github.com/nuxt-content/nuxt-studio/issues/10)) ([1fd3774](https://github.com/nuxt-content/nuxt-studio/commit/1fd3774c7122226b1973bb2e9ca4ec14db5bcebf))
* **host:** sync file selection ([#8](https://github.com/nuxt-content/nuxt-studio/issues/8)) ([d32afb1](https://github.com/nuxt-content/nuxt-studio/commit/d32afb17a9c44b1fbdf196be53fbf18842cdd643))
* integrate nuxt-auth-utils and authenticate with Google and Github ([072e8ef](https://github.com/nuxt-content/nuxt-studio/commit/072e8ef3a6babba5e492f48c35f8607d503fde27))
* **login:** server handler page ([#11](https://github.com/nuxt-content/nuxt-studio/issues/11)) ([b4d6646](https://github.com/nuxt-content/nuxt-studio/commit/b4d66461953fca52518f66ab355528948686e74a))
* **manifest:** display deployment alert ([48891a3](https://github.com/nuxt-content/nuxt-studio/commit/48891a3e7af1b28253d47578991e90666e3cba74))
* **media:** add copy button ([39c65bf](https://github.com/nuxt-content/nuxt-studio/commit/39c65bf2882d68f9feb6af38db14f8818a4cc1d4))
* **media:** create folder ([#36](https://github.com/nuxt-content/nuxt-studio/issues/36)) ([d793425](https://github.com/nuxt-content/nuxt-studio/commit/d793425e689cc428f8e4eae42abd90d4d6930e04))
* **media:** image editor ([49221aa](https://github.com/nuxt-content/nuxt-studio/commit/49221aad544b955382afaaeda0516d372704c912))
* **medias:** actions ([#33](https://github.com/nuxt-content/nuxt-studio/issues/33)) ([cca347a](https://github.com/nuxt-content/nuxt-studio/commit/cca347a04473ccefcb8acb32523951897c8c16fc))
* **medias:** initialize feature ([#17](https://github.com/nuxt-content/nuxt-studio/issues/17)) ([65a3255](https://github.com/nuxt-content/nuxt-studio/commit/65a32559cdaf47cca9362b7976b0d11d6edc7772))
* **media:** slugify name before uploading ([e1244cd](https://github.com/nuxt-content/nuxt-studio/commit/e1244cda8c1c07c2046052876621de3335ffccf8))
* **media:** upload and preview system with sw ([#18](https://github.com/nuxt-content/nuxt-studio/issues/18)) ([b8fc257](https://github.com/nuxt-content/nuxt-studio/commit/b8fc2574efbed98ab62d8c8c1c8f7999e8e7adcf))
* **media:** upload loading state ([cb047ed](https://github.com/nuxt-content/nuxt-studio/commit/cb047eddbe22dc169eed041f0e653e7d0710cea9))
* **playground:** define studio route ([7715a9a](https://github.com/nuxt-content/nuxt-studio/commit/7715a9a8ec808a53e2bf75bd8919d65706d3a36d))
* **preview:** sync from host to studio ([930fd0f](https://github.com/nuxt-content/nuxt-studio/commit/930fd0f7bd746b68bafd54b841a10ca2ddecdbcd))
* **publish:** publish changes ([#34](https://github.com/nuxt-content/nuxt-studio/issues/34)) ([d1d7562](https://github.com/nuxt-content/nuxt-studio/commit/d1d7562bc6b75f061f6678b0038bc7d0f7580f37))
* **publish:** success page ([4d7783a](https://github.com/nuxt-content/nuxt-studio/commit/4d7783ad1e43a94a64cc0d9b14436b81ba03140d))
* **review:** error page on publish fail ([3fc3c20](https://github.com/nuxt-content/nuxt-studio/commit/3fc3c205a7fa9bd418587928ec3a0be0b6323ffc))
* **success:** loading reload app button ([96fd570](https://github.com/nuxt-content/nuxt-studio/commit/96fd570b3a77326768b0585a6062f4c1a1b8afd0))
* **tree:** add prefix edition ([9aa7a02](https://github.com/nuxt-content/nuxt-studio/commit/9aa7a0229f3b58e49657f10e2f847dc65480af99))
* **tree:** compute tree based on fsPath ([#38](https://github.com/nuxt-content/nuxt-studio/issues/38)) ([b0e5c6a](https://github.com/nuxt-content/nuxt-studio/commit/b0e5c6a9d4b7c65d37cf0cb6c8f92061ff484fb9))
* **tree:** detect same file renaming + automatic error tooltip ([b0f781b](https://github.com/nuxt-content/nuxt-studio/commit/b0f781b175aaca370a6c0479785bf4bbdf94bdc1))
* **tree:** improve ui ([53529ab](https://github.com/nuxt-content/nuxt-studio/commit/53529ab36977ceb6bfc99e2eeab7a79479396aea))
* **ui:** banner for new website version detected ([5d143d9](https://github.com/nuxt-content/nuxt-studio/commit/5d143d9cd17d16ce5f327881bf7bb2d840b638f9))
* **ui:** content listing files + resizable panel ([#5](https://github.com/nuxt-content/nuxt-studio/issues/5)) ([73d1bb2](https://github.com/nuxt-content/nuxt-studio/commit/73d1bb277acaddf04d07b7c170f0874aa269ab8b))
* **ui:** editor panel ([#6](https://github.com/nuxt-content/nuxt-studio/issues/6)) ([935044f](https://github.com/nuxt-content/nuxt-studio/commit/935044fe1845e00c33ac06db14222e08e46c0002))
* **ui:** file breadcrumb ([498b867](https://github.com/nuxt-content/nuxt-studio/commit/498b86797d73b83ba8e675c13d2b67afcd3c9341))
* **ui:** handle ellipsis dropdown in breadcrumb ([77a4e3b](https://github.com/nuxt-content/nuxt-studio/commit/77a4e3bd130947db27d80ce7e73a5354c87feaf1))
* **ui:** improvements ([8326af2](https://github.com/nuxt-content/nuxt-studio/commit/8326af26ea40d34458e126a04e736dde25b1a141))
* **ui:** improvements UI UX ([2999867](https://github.com/nuxt-content/nuxt-studio/commit/299986730c301db647950d5b3b06093f3fea9767))
* **ui:** move toolbar up and sidebar left ([577597f](https://github.com/nuxt-content/nuxt-studio/commit/577597fbc7655d42af66dea65d366a4af55ee535))
* **ui:** new tree visual ([fee5a40](https://github.com/nuxt-content/nuxt-studio/commit/fee5a402fd27f27bf0c6533d03b9c8671f9616cd))
* **ui:** remove modals validation ([3f1cf80](https://github.com/nuxt-content/nuxt-studio/commit/3f1cf80922ac20d1cbb2f88b9eb5386190097181))
* **ui:** set close content panel by default ([014aef1](https://github.com/nuxt-content/nuxt-studio/commit/014aef12c843713de0285c58401976aecf01b65a))
* **ui:** toggle for technical view ([532304d](https://github.com/nuxt-content/nuxt-studio/commit/532304dd3b3444f6bdcf994d341de069ef8845ee))
* **useStudioState:** store if studio is active ([0ffce18](https://github.com/nuxt-content/nuxt-studio/commit/0ffce18e9d2d4abadba025aff6b665a4a9a70aff))

### Bug Fixes

* **actions:** create then rename ([cc9e347](https://github.com/nuxt-content/nuxt-studio/commit/cc9e3470420b3ab037cbc83795f6ba4aa6987f1b))
* **actions:** show tooltip directly for confirmation ([ef6ddca](https://github.com/nuxt-content/nuxt-studio/commit/ef6ddcaa4fbea379dbbbefbf144e3c40680a2d49))
* add dummy route to prevent vue-router warning ([e2a7142](https://github.com/nuxt-content/nuxt-studio/commit/e2a7142fcdf0e4ec87a9ce851605ba76f77955a3))
* auto-redirect to github for sign-in ([fea9d8f](https://github.com/nuxt-content/nuxt-studio/commit/fea9d8fa3027e184d4abae573087a434dc1a0f1d))
* **collection:** generate id for collection with prefix ([c3571e8](https://github.com/nuxt-content/nuxt-studio/commit/c3571e8882eab379846ca29d248002bbf6c1fdfd))
* **content:** do not navigate on navigation file ([07167b9](https://github.com/nuxt-content/nuxt-studio/commit/07167b926463e2b42ac3967045859f45ba6178ef))
* **content:** do not reselect current file ([edea263](https://github.com/nuxt-content/nuxt-studio/commit/edea2634f4e0e08e63b57e0a4935709f6843290e))
* **content:** editor experience ([#39](https://github.com/nuxt-content/nuxt-studio/issues/39)) ([53b645d](https://github.com/nuxt-content/nuxt-studio/commit/53b645d2775df8de552dac6809c391a3ecc2a1ed))
* **content:** parse/stringify different file types ([#14](https://github.com/nuxt-content/nuxt-studio/issues/14)) ([391b6c7](https://github.com/nuxt-content/nuxt-studio/commit/391b6c7fc6332f2f1a262ba1a940d5dada10cdb1))
* **content:** preserve TOC field on minify ([#27](https://github.com/nuxt-content/nuxt-studio/issues/27)) ([449e93e](https://github.com/nuxt-content/nuxt-studio/commit/449e93ec6f9227e9de2ea1482f05f4b9cce6b1a7))
* **content:** update remark mdc to fix frontmatter parsing ([cedcbf4](https://github.com/nuxt-content/nuxt-studio/commit/cedcbf40045e0ee92e99449be251f96bec9e1ac3))
* **content:** wrong db path on rename ([dc78b20](https://github.com/nuxt-content/nuxt-studio/commit/dc78b2035ff4d3634288a1a8ccb02ba909a6ba1f))
* **content:** yaml files behaviour ([#45](https://github.com/nuxt-content/nuxt-studio/issues/45)) ([d10548e](https://github.com/nuxt-content/nuxt-studio/commit/d10548ef8013d377cd3432ac98d4117832e92326))
* **context:** use fspath to find tree item ([e2bfd63](https://github.com/nuxt-content/nuxt-studio/commit/e2bfd630e8c8aee618d2508682ae8a3de0b5235f))
* **draft:** edge cases ([d6b7489](https://github.com/nuxt-content/nuxt-studio/commit/d6b7489f76d070a4a0cef455209c88606b53d69f))
* **editor:** handle deletion directly on file ([839bb18](https://github.com/nuxt-content/nuxt-studio/commit/839bb18b9780a66b7df70e0f5584478655d5db74))
* **editor:** improve document compare ([a457aca](https://github.com/nuxt-content/nuxt-studio/commit/a457aca7b12225ace589176a89c29fcf20ba2912))
* **editor:** media selection ([2bf3903](https://github.com/nuxt-content/nuxt-studio/commit/2bf39031a746c6c051ce41749fbcb9d733113d2f))
* **editor:** monaco word wrap ([2431814](https://github.com/nuxt-content/nuxt-studio/commit/2431814878c2a45346ca575fbce8a9094bd09b62))
* **editor:** multiple buggy experience ([#40](https://github.com/nuxt-content/nuxt-studio/issues/40)) ([941fb1c](https://github.com/nuxt-content/nuxt-studio/commit/941fb1c6c447d3651aab8dd737ec7b22aa301282))
* **git:** handle pushing removes/renamed files ([#28](https://github.com/nuxt-content/nuxt-studio/issues/28)) ([98878c5](https://github.com/nuxt-content/nuxt-studio/commit/98878c55b96f79a3dcc99a801af4fe12789f1652))
* **github:** conflict and loading state ([21ec482](https://github.com/nuxt-content/nuxt-studio/commit/21ec482f8e747e438846aa325fdddc3a98f7702f))
* **github:** remove pristine files from commit ([3050ad4](https://github.com/nuxt-content/nuxt-studio/commit/3050ad4241fb73dfb3f6779a613b516180b1d722))
* **lint:** add missing comma ([a1e5ffc](https://github.com/nuxt-content/nuxt-studio/commit/a1e5ffce45d1b4ca8293d257e839e30a7e520004))
* **lint:** missing comma ([a14720c](https://github.com/nuxt-content/nuxt-studio/commit/a14720c18443c2ba0761f0f3904e5487c7a2ea6e))
* **lint:** unused import ([d9269c4](https://github.com/nuxt-content/nuxt-studio/commit/d9269c430ac18c5d26ff8edb335942668b9adfc6))
* **login:** open ui on first connection ([2845657](https://github.com/nuxt-content/nuxt-studio/commit/28456578db5d3a4b7c3010721c7d888fb6e7094a))
* **manifest:** store previous id ([eeb920e](https://github.com/nuxt-content/nuxt-studio/commit/eeb920ef145b68711b042133e789160c782af3b0))
* **medias:** multiple rename of same file ([d87a79c](https://github.com/nuxt-content/nuxt-studio/commit/d87a79cc8ce97d5b641eb977c2466d2fe99e8b27))
* minor improvements ([#24](https://github.com/nuxt-content/nuxt-studio/issues/24)) ([17e13d8](https://github.com/nuxt-content/nuxt-studio/commit/17e13d82cd197b8e84038e9b84d81ab693ff6af6))
* **monaco:** dynamic readonly mode ([b55fdc2](https://github.com/nuxt-content/nuxt-studio/commit/b55fdc27ebfa2b9a41af056811bc416198cd2b7a))
* **monaco:** hide unchanged lines on diff view ([#37](https://github.com/nuxt-content/nuxt-studio/issues/37)) ([1e5ed36](https://github.com/nuxt-content/nuxt-studio/commit/1e5ed36dd0078f78a304964ceb614a30c5315bdd))
* **monaco:** remove padding for better ui ([5ab1473](https://github.com/nuxt-content/nuxt-studio/commit/5ab14738eadf7f97ad4772c92739865c70c2da14))
* **review:** images ([3ee5a04](https://github.com/nuxt-content/nuxt-studio/commit/3ee5a045311b615bf23d716946d257483b7bfda3))
* **router:** missing await ([3a7ea76](https://github.com/nuxt-content/nuxt-studio/commit/3a7ea76a70318fd36dede531981345b637d98b5d))
* **signout:** reload app ([20a4947](https://github.com/nuxt-content/nuxt-studio/commit/20a4947b219e18b33a188be549fa45d593494962))
* **state:** location redirection ([de8dc1b](https://github.com/nuxt-content/nuxt-studio/commit/de8dc1be8cd08f8f4a8c2c492ab96db7cdab64a1))
* **success:** increment timeout ([efbdbf9](https://github.com/nuxt-content/nuxt-studio/commit/efbdbf970cf1f82a7cb2efdd2e0647b604f9854f))
* **test:** add prefix in tree ([4aa6e9c](https://github.com/nuxt-content/nuxt-studio/commit/4aa6e9c3bfe022396509dffa8579f71d8e61677a))
* **test:** remove only ([61e59f9](https://github.com/nuxt-content/nuxt-studio/commit/61e59f99266c995b652083590769b05524f89867))
* **test:** remove useless ([dca471f](https://github.com/nuxt-content/nuxt-studio/commit/dca471f5bc3a2165b234a6b4e10b564e21cdd6ef))
* **tree:** cancel rename when user click outside of form ([4ffd62e](https://github.com/nuxt-content/nuxt-studio/commit/4ffd62e29ec58944a3fc60f0f5740c468507dd42))
* **tree:** do not close form when click on extension ([5a8d784](https://github.com/nuxt-content/nuxt-studio/commit/5a8d7842ffbe88cb275a7238b64e58a8d808ca9f))
* **tree:** do not store collection in directory id ([410d7b9](https://github.com/nuxt-content/nuxt-studio/commit/410d7b937a8da21c50cf3e5312ffec7ed2e6147b))
* **tree:** fs path for prefixed source ([4f81f27](https://github.com/nuxt-content/nuxt-studio/commit/4f81f272550627ffaf813ebd7c748345f13e9ca6))
* **tree:** handle actions from all levels ([5c67c3b](https://github.com/nuxt-content/nuxt-studio/commit/5c67c3b8792205d2763bb39fd4a774786c8764a7))
* **tree:** handle empty prefix ([6c12ca9](https://github.com/nuxt-content/nuxt-studio/commit/6c12ca9f12ad3cebcd60a9c8a0490797846a0685))
* **tree:** only diplay prefix for document ([4488dd6](https://github.com/nuxt-content/nuxt-studio/commit/4488dd66ce6591e37918c1da6546354f398a86d7))
* **tree:** rename file on current index ([136a68f](https://github.com/nuxt-content/nuxt-studio/commit/136a68f70d61c0908c08f46fc8b030456d50b4c7))
* **tree:** status on root item ([89d1f63](https://github.com/nuxt-content/nuxt-studio/commit/89d1f63d8f290354e2e1865714b59c5bd52be2f1))
* **types:** error when mounting app ([ba39b25](https://github.com/nuxt-content/nuxt-studio/commit/ba39b252f08d1f990b0b89790d6b401dfd8c9c4b))
* **ui:** close content by default ([3457e93](https://github.com/nuxt-content/nuxt-studio/commit/3457e9390b99bd38b57048cbe02aec35e1cc3eca))
* **ui:** refine UI styles ([#30](https://github.com/nuxt-content/nuxt-studio/issues/30)) ([a36ad89](https://github.com/nuxt-content/nuxt-studio/commit/a36ad8920be79d1b4c9fe6a6087128806ac11299))
* **useGit:** only commit non pristine files ([c567487](https://github.com/nuxt-content/nuxt-studio/commit/c56748797ef9e1b968f9a2b81b8aa435849a8d8f))
* **useStudioState:** set location when switching feature tabs ([fdab7b4](https://github.com/nuxt-content/nuxt-studio/commit/fdab7b4248f67707ac43d67ededd1149c073fb11))
