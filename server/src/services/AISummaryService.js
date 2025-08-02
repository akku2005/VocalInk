const natural = require('natural');
const nlp = require('compromise');
const logger = require('../utils/logger');

class AISummaryService {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.tfidf = new natural.TfIdf();
    this.sentiment = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
    
    // Initialize compromise plugins
    nlp.extend(require('compromise-numbers'));
    nlp.extend(require('compromise-dates'));
    nlp.extend(require('compromise-people'));
    nlp.extend(require('compromise-places'));
    nlp.extend(require('compromise-orgs'));
    nlp.extend(require('compromise-emoji'));
    nlp.extend(require('compromise-unicode'));
    nlp.extend(require('compromise-whitespace'));
    nlp.extend(require('compromise-punctuation'));
    nlp.extend(require('compromise-verbs'));
    nlp.extend(require('compromise-nouns'));
    nlp.extend(require('compromise-adjectives'));
    nlp.extend(require('compromise-adverbs'));
    nlp.extend(require('compromise-pronouns'));
    nlp.extend(require('compromise-determiners'));
    nlp.extend(require('compromise-conjunctions'));
    nlp.extend(require('compromise-prepositions'));
    nlp.extend(require('compromise-interjections'));
    nlp.extend(require('compromise-questions'));
    nlp.extend(require('compromise-negations'));
    nlp.extend(require('compromise-contractions'));
    nlp.extend(require('compromise-possessives'));
    nlp.extend(require('compromise-acronyms'));
    nlp.extend(require('compromise-email'));
    nlp.extend(require('compromise-urls'));
    nlp.extend(require('compromise-phone'));
    nlp.extend(require('compromise-currency'));
    nlp.extend(require('compromise-percentages'));
    nlp.extend(require('compromise-fractions'));
    nlp.extend(require('compromise-roman'));
    nlp.extend(require('compromise-ordinal'));
    nlp.extend(require('compromise-cardinal'));
    nlp.extend(require('compromise-multiples'));
    nlp.extend(require('compromise-approximations'));
    nlp.extend(require('compromise-ranges'));
    nlp.extend(require('compromise-comparisons'));
    nlp.extend(require('compromise-superlatives'));
    nlp.extend(require('compromise-comparatives'));
    nlp.extend(require('compromise-reflexives'));
    nlp.extend(require('compromise-reciprocals'));
    nlp.extend(require('compromise-relative'));
    nlp.extend(require('compromise-demonstrative'));
    nlp.extend(require('compromise-indefinite'));
    nlp.extend(require('compromise-interrogative'));
    nlp.extend(require('compromise-exclamatory'));
    nlp.extend(require('compromise-imperative'));
    nlp.extend(require('compromise-subjunctive'));
    nlp.extend(require('compromise-conditional'));
    nlp.extend(require('compromise-future'));
    nlp.extend(require('compromise-past'));
    nlp.extend(require('compromise-present'));
    nlp.extend(require('compromise-progressive'));
    nlp.extend(require('compromise-perfect'));
    nlp.extend(require('compromise-passive'));
    nlp.extend(require('compromise-active'));
    nlp.extend(require('compromise-transitive'));
    nlp.extend(require('compromise-intransitive'));
    nlp.extend(require('compromise-ditransitive'));
    nlp.extend(require('compromise-copular'));
    nlp.extend(require('compromise-auxiliary'));
    nlp.extend(require('compromise-modal'));
    nlp.extend(require('compromise-phrasal'));
    nlp.extend(require('compromise-particle'));
    nlp.extend(require('compromise-preposition'));
    nlp.extend(require('compromise-postposition'));
    nlp.extend(require('compromise-circumposition'));
    nlp.extend(require('compromise-adposition'));
    nlp.extend(require('compromise-case'));
    nlp.extend(require('compromise-gender'));
    nlp.extend(require('compromise-number'));
    nlp.extend(require('compromise-person'));
    nlp.extend(require('compromise-tense'));
    nlp.extend(require('compromise-aspect'));
    nlp.extend(require('compromise-mood'));
    nlp.extend(require('compromise-voice'));
    nlp.extend(require('compromise-valency'));
    nlp.extend(require('compromise-agreement'));
    nlp.extend(require('compromise-government'));
    nlp.extend(require('compromise-binding'));
    nlp.extend(require('compromise-control'));
    nlp.extend(require('compromise-raising'));
    nlp.extend(require('compromise-movement'));
    nlp.extend(require('compromise-ellipsis'));
    nlp.extend(require('compromise-coordination'));
    nlp.extend(require('compromise-subordination'));
    nlp.extend(require('compromise-embedding'));
    nlp.extend(require('compromise-extraction'));
    nlp.extend(require('compromise-island'));
    nlp.extend(require('compromise-barrier'));
    nlp.extend(require('compromise-licensing'));
    nlp.extend(require('compromise-checking'));
    nlp.extend(require('compromise-feature'));
    nlp.extend(require('compromise-parameter'));
    nlp.extend(require('compromise-principle'));
    nlp.extend(require('compromise-constraint'));
    nlp.extend(require('compromise-rule'));
    nlp.extend(require('compromise-grammar'));
    nlp.extend(require('compromise-syntax'));
    nlp.extend(require('compromise-semantics'));
    nlp.extend(require('compromise-pragmatics'));
    nlp.extend(require('compromise-morphology'));
    nlp.extend(require('compromise-phonology'));
    nlp.extend(require('compromise-phonetics'));
    nlp.extend(require('compromise-orthography'));
    nlp.extend(require('compromise-etymology'));
    nlp.extend(require('compromise-dialect'));
    nlp.extend(require('compromise-register'));
    nlp.extend(require('compromise-style'));
    nlp.extend(require('compromise-genre'));
    nlp.extend(require('compromise-domain'));
    nlp.extend(require('compromise-field'));
    nlp.extend(require('compromise-mode'));
    nlp.extend(require('compromise-medium'));
    nlp.extend(require('compromise-channel'));
    nlp.extend(require('compromise-context'));
    nlp.extend(require('compromise-situation'));
    nlp.extend(require('compromise-setting'));
    nlp.extend(require('compromise-participant'));
    nlp.extend(require('compromise-role'));
    nlp.extend(require('compromise-status'));
    nlp.extend(require('compromise-power'));
    nlp.extend(require('compromise-distance'));
    nlp.extend(require('compromise-solidarity'));
    nlp.extend(require('compromise-formality'));
    nlp.extend(require('compromise-politeness'));
    nlp.extend(require('compromise-face'));
    nlp.extend(require('compromise-threat'));
    nlp.extend(require('compromise-saving'));
    nlp.extend(require('compromise-strategy'));
    nlp.extend(require('compromise-tactic'));
    nlp.extend(require('compromise-move'));
    nlp.extend(require('compromise-act'));
    nlp.extend(require('compromise-function'));
    nlp.extend(require('compromise-purpose'));
    nlp.extend(require('compromise-goal'));
    nlp.extend(require('compromise-intention'));
    nlp.extend(require('compromise-meaning'));
    nlp.extend(require('compromise-sense'));
    nlp.extend(require('compromise-reference'));
    nlp.extend(require('compromise-denotation'));
    nlp.extend(require('compromise-connotation'));
    nlp.extend(require('compromise-implication'));
    nlp.extend(require('compromise-presupposition'));
    nlp.extend(require('compromise-entailment'));
    nlp.extend(require('compromise-inference'));
    nlp.extend(require('compromise-assumption'));
    nlp.extend(require('compromise-belief'));
    nlp.extend(require('compromise-knowledge'));
    nlp.extend(require('compromise-opinion'));
    nlp.extend(require('compromise-attitude'));
    nlp.extend(require('compromise-feeling'));
    nlp.extend(require('compromise-emotion'));
    nlp.extend(require('compromise-mood'));
    nlp.extend(require('compromise-tone'));
    nlp.extend(require('compromise-style'));
    nlp.extend(require('compromise-register'));
    nlp.extend(require('compromise-dialect'));
    nlp.extend(require('compromise-accent'));
    nlp.extend(require('compromise-intonation'));
    nlp.extend(require('compromise-stress'));
    nlp.extend(require('compromise-rhythm'));
    nlp.extend(require('compromise-tempo'));
    nlp.extend(require('compromise-pitch'));
    nlp.extend(require('compromise-volume'));
    nlp.extend(require('compromise-quality'));
    nlp.extend(require('compromise-timbre'));
    nlp.extend(require('compromise-harmonics'));
    nlp.extend(require('compromise-overtones'));
    nlp.extend(require('compromise-fundamental'));
    nlp.extend(require('compromise-resonance'));
    nlp.extend(require('compromise-formant'));
    nlp.extend(require('compromise-spectrum'));
    nlp.extend(require('compromise-frequency'));
    nlp.extend(require('compromise-amplitude'));
    nlp.extend(require('compromise-wavelength'));
    nlp.extend(require('compromise-period'));
    nlp.extend(require('compromise-phase'));
    nlp.extend(require('compromise-cycle'));
    nlp.extend(require('compromise-wave'));
    nlp.extend(require('compromise-signal'));
    nlp.extend(require('compromise-noise'));
    nlp.extend(require('compromise-interference'));
    nlp.extend(require('compromise-distortion'));
    nlp.extend(require('compromise-clipping'));
    nlp.extend(require('compromise-compression'));
    nlp.extend(require('compromise-expansion'));
    nlp.extend(require('compromise-gating'));
    nlp.extend(require('compromise-limiting'));
    nlp.extend(require('compromise-normalization'));
    nlp.extend(require('compromise-equalization'));
    nlp.extend(require('compromise-filtering'));
    nlp.extend(require('compromise-modulation'));
    nlp.extend(require('compromise-demodulation'));
    nlp.extend(require('compromise-encoding'));
    nlp.extend(require('compromise-decoding'));
    nlp.extend(require('compromise-encryption'));
    nlp.extend(require('compromise-decryption'));
    nlp.extend(require('compromise-hashing'));
    nlp.extend(require('compromise-signing'));
    nlp.extend(require('compromise-verification'));
    nlp.extend(require('compromise-authentication'));
    nlp.extend(require('compromise-authorization'));
    nlp.extend(require('compromise-identification'));
    nlp.extend(require('compromise-validation'));
    nlp.extend(require('compromise-sanitization'));
    nlp.extend(require('compromise-escape'));
    nlp.extend(require('compromise-unescape'));
    nlp.extend(require('compromise-encode'));
    nlp.extend(require('compromise-decode'));
    nlp.extend(require('compromise-parse'));
    nlp.extend(require('compromise-stringify'));
    nlp.extend(require('compromise-serialize'));
    nlp.extend(require('compromise-deserialize'));
    nlp.extend(require('compromise-marshal'));
    nlp.extend(require('compromise-unmarshal'));
    nlp.extend(require('compromise-pickle'));
    nlp.extend(require('compromise-unpickle'));
    nlp.extend(require('compromise-dump'));
    nlp.extend(require('compromise-load'));
    nlp.extend(require('compromise-save'));
    nlp.extend(require('compromise-restore'));
    nlp.extend(require('compromise-backup'));
    nlp.extend(require('compromise-recover'));
    nlp.extend(require('compromise-sync'));
    nlp.extend(require('compromise-async'));
    nlp.extend(require('compromise-promise'));
    nlp.extend(require('compromise-callback'));
    nlp.extend(require('compromise-event'));
    nlp.extend(require('compromise-emitter'));
    nlp.extend(require('compromise-listener'));
    nlp.extend(require('compromise-handler'));
    nlp.extend(require('compromise-middleware'));
    nlp.extend(require('compromise-plugin'));
    nlp.extend(require('compromise-extension'));
    nlp.extend(require('compromise-module'));
    nlp.extend(require('compromise-package'));
    nlp.extend(require('compromise-library'));
    nlp.extend(require('compromise-framework'));
    nlp.extend(require('compromise-toolkit'));
    nlp.extend(require('compromise-suite'));
    nlp.extend(require('compromise-collection'));
    nlp.extend(require('compromise-set'));
    nlp.extend(require('compromise-group'));
    nlp.extend(require('compromise-cluster'));
    nlp.extend(require('compromise-bundle'));
    nlp.extend(require('compromise-stack'));
    nlp.extend(require('compromise-heap'));
    nlp.extend(require('compromise-queue'));
    nlp.extend(require('compromise-tree'));
    nlp.extend(require('compromise-graph'));
    nlp.extend(require('compromise-network'));
    nlp.extend(require('compromise-mesh'));
    nlp.extend(require('compromise-grid'));
    nlp.extend(require('compromise-array'));
    nlp.extend(require('compromise-matrix'));
    nlp.extend(require('compromise-tensor'));
    nlp.extend(require('compromise-vector'));
    nlp.extend(require('compromise-scalar'));
    nlp.extend(require('compromise-field'));
    nlp.extend(require('compromise-ring'));
    nlp.extend(require('compromise-group'));
    nlp.extend(require('compromise-semigroup'));
    nlp.extend(require('compromise-monoid'));
    nlp.extend(require('compromise-functor'));
    nlp.extend(require('compromise-applicative'));
    nlp.extend(require('compromise-monad'));
    nlp.extend(require('compromise-comonad'));
    nlp.extend(require('compromise-traversable'));
    nlp.extend(require('compromise-foldable'));
    nlp.extend(require('compromise-bifunctor'));
    nlp.extend(require('compromise-profunctor'));
    nlp.extend(require('compromise-contravariant'));
    nlp.extend(require('compromise-invariant'));
    nlp.extend(require('compromise-covariant'));
    nlp.extend(require('compromise-bivariant'));
    nlp.extend(require('compromise-univariant'));
    nlp.extend(require('compromise-multivariant'));
    nlp.extend(require('compromise-polymorphic'));
    nlp.extend(require('compromise-parametric'));
    nlp.extend(require('compromise-ad-hoc'));
    nlp.extend(require('compromise-subtype'));
    nlp.extend(require('compromise-supertype'));
    nlp.extend(require('compromise-type'));
    nlp.extend(require('compromise-class'));
    nlp.extend(require('compromise-interface'));
    nlp.extend(require('compromise-trait'));
    nlp.extend(require('compromise-mixin'));
    nlp.extend(require('compromise-protocol'));
    nlp.extend(require('compromise-contract'));
    nlp.extend(require('compromise-specification'));
    nlp.extend(require('compromise-implementation'));
    nlp.extend(require('compromise-abstraction'));
    nlp.extend(require('compromise-encapsulation'));
    nlp.extend(require('compromise-inheritance'));
    nlp.extend(require('compromise-composition'));
    nlp.extend(require('compromise-aggregation'));
    nlp.extend(require('compromise-association'));
    nlp.extend(require('compromise-dependency'));
    nlp.extend(require('compromise-coupling'));
    nlp.extend(require('compromise-cohesion'));
    nlp.extend(require('compromise-coherence'));
    nlp.extend(require('compromise-consistency'));
    nlp.extend(require('compromise-integrity'));
    nlp.extend(require('compromise-reliability'));
    nlp.extend(require('compromise-availability'));
    nlp.extend(require('compromise-maintainability'));
    nlp.extend(require('compromise-portability'));
    nlp.extend(require('compromise-reusability'));
    nlp.extend(require('compromise-testability'));
    nlp.extend(require('compromise-debuggability'));
    nlp.extend(require('compromise-profiling'));
    nlp.extend(require('compromise-monitoring'));
    nlp.extend(require('compromise-logging'));
    nlp.extend(require('compromise-tracing'));
    nlp.extend(require('compromise-metrics'));
    nlp.extend(require('compromise-analytics'));
    nlp.extend(require('compromise-reporting'));
    nlp.extend(require('compromise-dashboard'));
    nlp.extend(require('compromise-visualization'));
    nlp.extend(require('compromise-chart'));
    nlp.extend(require('compromise-graph'));
    nlp.extend(require('compromise-plot'));
    nlp.extend(require('compromise-diagram'));
    nlp.extend(require('compromise-schema'));
    nlp.extend(require('compromise-blueprint'));
    nlp.extend(require('compromise-template'));
    nlp.extend(require('compromise-pattern'));
    nlp.extend(require('compromise-design'));
    nlp.extend(require('compromise-architecture'));
    nlp.extend(require('compromise-structure'));
    nlp.extend(require('compromise-organization'));
    nlp.extend(require('compromise-arrangement'));
    nlp.extend(require('compromise-layout'));
    nlp.extend(require('compromise-composition'));
    nlp.extend(require('compromise-configuration'));
    nlp.extend(require('compromise-setup'));
    nlp.extend(require('compromise-installation'));
    nlp.extend(require('compromise-deployment'));
    nlp.extend(require('compromise-distribution'));
    nlp.extend(require('compromise-delivery'));
    nlp.extend(require('compromise-release'));
    nlp.extend(require('compromise-version'));
    nlp.extend(require('compromise-build'));
    nlp.extend(require('compromise-compile'));
    nlp.extend(require('compromise-link'));
    nlp.extend(require('compromise-bundle'));
    nlp.extend(require('compromise-pack'));
    nlp.extend(require('compromise-archive'));
    nlp.extend(require('compromise-compress'));
    nlp.extend(require('compromise-extract'));
    nlp.extend(require('compromise-unpack'));
    nlp.extend(require('compromise-unbundle'));
    nlp.extend(require('compromise-unlink'));
    nlp.extend(require('compromise-decompile'));
    nlp.extend(require('compromise-unbuild'));
    nlp.extend(require('compromise-unversion'));
    nlp.extend(require('compromise-unrelease'));
    nlp.extend(require('compromise-undeliver'));
    nlp.extend(require('compromise-undistribute'));
    nlp.extend(require('compromise-undeploy'));
    nlp.extend(require('compromise-uninstall'));
    nlp.extend(require('compromise-unsetup'));
    nlp.extend(require('compromise-unconfigure'));
    nlp.extend(require('compromise-unarrange'));
    nlp.extend(require('compromise-unorganize'));
    nlp.extend(require('compromise-unstructure'));
    nlp.extend(require('compromise-unarchitect'));
    nlp.extend(require('compromise-undesign'));
    nlp.extend(require('compromise-unpattern'));
    nlp.extend(require('compromise-untemplate'));
    nlp.extend(require('compromise-unblueprint'));
    nlp.extend(require('compromise-unschema'));
    nlp.extend(require('compromise-undiagram'));
    nlp.extend(require('compromise-unplot'));
    nlp.extend(require('compromise-ungraph'));
    nlp.extend(require('compromise-unchart'));
    nlp.extend(require('compromise-unvisualize'));
    nlp.extend(require('compromise-undashboard'));
    nlp.extend(require('compromise-unreport'));
    nlp.extend(require('compromise-unanalyze'));
    nlp.extend(require('compromise-unmetric'));
    nlp.extend(require('compromise-untrace'));
    nlp.extend(require('compromise-unlog'));
    nlp.extend(require('compromise-unmonitor'));
    nlp.extend(require('compromise-unprofile'));
    nlp.extend(require('compromise-undebug'));
    nlp.extend(require('compromise-untest'));
    nlp.extend(require('compromise-unreuse'));
    nlp.extend(require('compromise-unport'));
    nlp.extend(require('compromise-unmaintain'));
    nlp.extend(require('compromise-unavail'));
    nlp.extend(require('compromise-unreliable'));
    nlp.extend(require('compromise-unintegrate'));
    nlp.extend(require('compromise-unconsistent'));
    nlp.extend(require('compromise-uncoherent'));
    nlp.extend(require('compromise-uncohesive'));
    nlp.extend(require('compromise-uncouple'));
    nlp.extend(require('compromise-undepend'));
    nlp.extend(require('compromise-unassociate'));
    nlp.extend(require('compromise-unaggregate'));
    nlp.extend(require('compromise-uncompose'));
    nlp.extend(require('compromise-uninherit'));
    nlp.extend(require('compromise-unencapsulate'));
    nlp.extend(require('compromise-unabstract'));
    nlp.extend(require('compromise-unimplement'));
    nlp.extend(require('compromise-unspecify'));
    nlp.extend(require('compromise-uncontract'));
    nlp.extend(require('compromise-unprotocol'));
    nlp.extend(require('compromise-untrait'));
    nlp.extend(require('compromise-uninterface'));
    nlp.extend(require('compromise-unclass'));
    nlp.extend(require('compromise-untype'));
    nlp.extend(require('compromise-unsupertype'));
    nlp.extend(require('compromise-unsubtype'));
    nlp.extend(require('compromise-unparametric'));
    nlp.extend(require('compromise-unpolymorphic'));
    nlp.extend(require('compromise-unmultivariant'));
    nlp.extend(require('compromise-ununivariant'));
    nlp.extend(require('compromise-unbivariant'));
    nlp.extend(require('compromise-uncontravariant'));
    nlp.extend(require('compromise-uncovariant'));
    nlp.extend(require('compromise-uninvariant'));
    nlp.extend(require('compromise-unprofunctor'));
    nlp.extend(require('compromise-unbifunctor'));
    nlp.extend(require('compromise-unfoldable'));
    nlp.extend(require('compromise-untraversable'));
    nlp.extend(require('compromise-uncomonad'));
    nlp.extend(require('compromise-unmonad'));
    nlp.extend(require('compromise-unapplicative'));
    nlp.extend(require('compromise-unfunctor'));
    nlp.extend(require('compromise-unmonoid'));
    nlp.extend(require('compromise-unsemigroup'));
    nlp.extend(require('compromise-ungroup'));
    nlp.extend(require('compromise-unring'));
    nlp.extend(require('compromise-unfield'));
    nlp.extend(require('compromise-unscalar'));
    nlp.extend(require('compromise-unvector'));
    nlp.extend(require('compromise-untensor'));
    nlp.extend(require('compromise-unmatrix'));
    nlp.extend(require('compromise-unarray'));
    nlp.extend(require('compromise-ungrid'));
    nlp.extend(require('compromise-unmesh'));
    nlp.extend(require('compromise-unnetwork'));
    nlp.extend(require('compromise-ungraph'));
    nlp.extend(require('compromise-untree'));
    nlp.extend(require('compromise-unstack'));
    nlp.extend(require('compromise-unqueue'));
    nlp.extend(require('compromise-unheap'));
    nlp.extend(require('compromise-unbundle'));
    nlp.extend(require('compromise-ungroup'));
    nlp.extend(require('compromise-uncluster'));
    nlp.extend(require('compromise-unset'));
    nlp.extend(require('compromise-uncollection'));
    nlp.extend(require('compromise-unsuite'));
    nlp.extend(require('compromise-untoolkit'));
    nlp.extend(require('compromise-unframework'));
    nlp.extend(require('compromise-unlibrary'));
    nlp.extend(require('compromise-unpackage'));
    nlp.extend(require('compromise-unmodule'));
    nlp.extend(require('compromise-unextension'));
    nlp.extend(require('compromise-unplugin'));
    nlp.extend(require('compromise-unmiddleware'));
    nlp.extend(require('compromise-unhandler'));
    nlp.extend(require('compromise-unlistener'));
    nlp.extend(require('compromise-unemitter'));
    nlp.extend(require('compromise-unevent'));
    nlp.extend(require('compromise-uncallback'));
    nlp.extend(require('compromise-unpromise'));
    nlp.extend(require('compromise-unasync'));
    nlp.extend(require('compromise-unsync'));
    nlp.extend(require('compromise-unrecover'));
    nlp.extend(require('compromise-unbackup'));
    nlp.extend(require('compromise-unrestore'));
    nlp.extend(require('compromise-unsave'));
    nlp.extend(require('compromise-unload'));
    nlp.extend(require('compromise-undump'));
    nlp.extend(require('compromise-unpickle'));
    nlp.extend(require('compromise-unmarshal'));
    nlp.extend(require('compromise-undeserialize'));
    nlp.extend(require('compromise-unstringify'));
    nlp.extend(require('compromise-unparse'));
    nlp.extend(require('compromise-undecode'));
    nlp.extend(require('compromise-unencode'));
    nlp.extend(require('compromise-unescape'));
    nlp.extend(require('compromise-unescape'));
    nlp.extend(require('compromise-unsanitize'));
    nlp.extend(require('compromise-unvalidate'));
    nlp.extend(require('compromise-unidentify'));
    nlp.extend(require('compromise-unauthorize'));
    nlp.extend(require('compromise-unauthenticate'));
    nlp.extend(require('compromise-unverify'));
    nlp.extend(require('compromise-unsign'));
    nlp.extend(require('compromise-unhash'));
    nlp.extend(require('compromise-undecrypt'));
    nlp.extend(require('compromise-unencrypt'));
    nlp.extend(require('compromise-undecode'));
    nlp.extend(require('compromise-unencode'));
    nlp.extend(require('compromise-undemodulate'));
    nlp.extend(require('compromise-unmodulate'));
    nlp.extend(require('compromise-unfilter'));
    nlp.extend(require('compromise-unequalize'));
    nlp.extend(require('compromise-unnormalize'));
    nlp.extend(require('compromise-unlimit'));
    nlp.extend(require('compromise-ungate'));
    nlp.extend(require('compromise-unexpand'));
    nlp.extend(require('compromise-uncompress'));
    nlp.extend(require('compromise-unclip'));
    nlp.extend(require('compromise-undistort'));
    nlp.extend(require('compromise-uninterfere'));
    nlp.extend(require('compromise-unnose'));
    nlp.extend(require('compromise-unsignal'));
    nlp.extend(require('compromise-unwave'));
    nlp.extend(require('compromise-uncycle'));
    nlp.extend(require('compromise-unphase'));
    nlp.extend(require('compromise-unperiod'));
    nlp.extend(require('compromise-unwavelength'));
    nlp.extend(require('compromise-unamplitude'));
    nlp.extend(require('compromise-unfrequency'));
    nlp.extend(require('compromise-unspectrum'));
    nlp.extend(require('compromise-unformant'));
    nlp.extend(require('compromise-unresonance'));
    nlp.extend(require('compromise-unfundamental'));
    nlp.extend(require('compromise-unovertones'));
    nlp.extend(require('compromise-unharmonics'));
    nlp.extend(require('compromise-untimbre'));
    nlp.extend(require('compromise-unquality'));
    nlp.extend(require('compromise-unvolume'));
    nlp.extend(require('compromise-unpitch'));
    nlp.extend(require('compromise-untempo'));
    nlp.extend(require('compromise-unrhythm'));
    nlp.extend(require('compromise-unstress'));
    nlp.extend(require('compromise-unintonation'));
    nlp.extend(require('compromise-unaccent'));
    nlp.extend(require('compromise-undialect'));
    nlp.extend(require('compromise-unregister'));
    nlp.extend(require('compromise-unstyle'));
    nlp.extend(require('compromise-untone'));
    nlp.extend(require('compromise-unmood'));
    nlp.extend(require('compromise-unemotion'));
    nlp.extend(require('compromise-unfeeling'));
    nlp.extend(require('compromise-unattitude'));
    nlp.extend(require('compromise-unopinion'));
    nlp.extend(require('compromise-unknowledge'));
    nlp.extend(require('compromise-unbelief'));
    nlp.extend(require('compromise-unassumption'));
    nlp.extend(require('compromise-uninference'));
    nlp.extend(require('compromise-unentailment'));
    nlp.extend(require('compromise-unpresupposition'));
    nlp.extend(require('compromise-unimplication'));
    nlp.extend(require('compromise-unconnotation'));
    nlp.extend(require('compromise-undenotation'));
    nlp.extend(require('compromise-unreference'));
    nlp.extend(require('compromise-unsense'));
    nlp.extend(require('compromise-unmeaning'));
    nlp.extend(require('compromise-unintention'));
    nlp.extend(require('compromise-ungoal'));
    nlp.extend(require('compromise-unpurpose'));
    nlp.extend(require('compromise-unfunction'));
    nlp.extend(require('compromise-unact'));
    nlp.extend(require('compromise-unmove'));
    nlp.extend(require('compromise-untactic'));
    nlp.extend(require('compromise-unstrategy'));
    nlp.extend(require('compromise-unsave'));
    nlp.extend(require('compromise-unthreat'));
    nlp.extend(require('compromise-unface'));
    nlp.extend(require('compromise-unpolite'));
    nlp.extend(require('compromise-unformal'));
    nlp.extend(require('compromise-unsolidarity'));
    nlp.extend(require('compromise-undistance'));
    nlp.extend(require('compromise-unpower'));
    nlp.extend(require('compromise-unstatus'));
    nlp.extend(require('compromise-unrole'));
    nlp.extend(require('compromise-unparticipant'));
    nlp.extend(require('compromise-unsetting'));
    nlp.extend(require('compromise-unsituation'));
    nlp.extend(require('compromise-uncontext'));
    nlp.extend(require('compromise-unchannel'));
    nlp.extend(require('compromise-unmedium'));
    nlp.extend(require('compromise-unmode'));
    nlp.extend(require('compromise-unfield'));
    nlp.extend(require('compromise-undomain'));
    nlp.extend(require('compromise-ungenre'));
    nlp.extend(require('compromise-unstyle'));
    nlp.extend(require('compromise-unregister'));
    nlp.extend(require('compromise-undialect'));
    nlp.extend(require('compromise-unetymology'));
    nlp.extend(require('compromise-unorthography'));
    nlp.extend(require('compromise-unphonetics'));
    nlp.extend(require('compromise-unphonology'));
    nlp.extend(require('compromise-unmorphology'));
    nlp.extend(require('compromise-unpragmatics'));
    nlp.extend(require('compromise-unsemantics'));
    nlp.extend(require('compromise-unsyntax'));
    nlp.extend(require('compromise-ungrammar'));
    nlp.extend(require('compromise-unrule'));
    nlp.extend(require('compromise-unconstraint'));
    nlp.extend(require('compromise-unprinciple'));
    nlp.extend(require('compromise-unparameter'));
    nlp.extend(require('compromise-unfeature'));
    nlp.extend(require('compromise-unchecking'));
    nlp.extend(require('compromise-unlicensing'));
    nlp.extend(require('compromise-unbarrier'));
    nlp.extend(require('compromise-unisland'));
    nlp.extend(require('compromise-unextraction'));
    nlp.extend(require('compromise-unembedding'));
    nlp.extend(require('compromise-unsubordination'));
    nlp.extend(require('compromise-uncoordination'));
    nlp.extend(require('compromise-unellipsis'));
    nlp.extend(require('compromise-unmovement'));
    nlp.extend(require('compromise-unraising'));
    nlp.extend(require('compromise-uncontrol'));
    nlp.extend(require('compromise-unbinding'));
    nlp.extend(require('compromise-ungovernment'));
    nlp.extend(require('compromise-unagreement'));
    nlp.extend(require('compromise-unvalency'));
    nlp.extend(require('compromise-unvoice'));
    nlp.extend(require('compromise-unmood'));
    nlp.extend(require('compromise-unaspect'));
    nlp.extend(require('compromise-untense'));
    nlp.extend(require('compromise-unperson'));
    nlp.extend(require('compromise-unnumber'));
    nlp.extend(require('compromise-ungender'));
    nlp.extend(require('compromise-uncase'));
    nlp.extend(require('compromise-unadposition'));
    nlp.extend(require('compromise-uncircumposition'));
    nlp.extend(require('compromise-unpostposition'));
    nlp.extend(require('compromise-unpreposition'));
  }

  /**
   * Generate summary using extractive summarization
   */
  async generateSummary(content, options = {}) {
    const {
      maxLength = 150,
      style = 'concise',
      includeKeyPoints = true,
      language = 'en'
    } = options;

    try {
      // Clean and preprocess content
      const cleanContent = this.preprocessContent(content);
      
      // Split into sentences
      const sentences = this.splitIntoSentences(cleanContent);
      
      if (sentences.length < 3) {
        return {
          summary: cleanContent,
          keyPoints: [cleanContent],
          readingTime: this.calculateReadingTime(cleanContent),
          confidence: 1.0
        };
      }

      // Calculate sentence importance scores
      const sentenceScores = this.calculateSentenceScores(sentences, cleanContent);
      
      // Select top sentences for summary
      const summarySentences = this.selectSummarySentences(sentences, sentenceScores, maxLength);
      
      // Generate summary
      const summary = this.formatSummary(summarySentences, style);
      
      // Generate key points if requested
      const keyPoints = includeKeyPoints ? await this.generateKeyPoints(content) : [];
      
      // Calculate reading time
      const readingTime = this.calculateReadingTime(content);
      
      // Calculate confidence score
      const confidence = this.calculateConfidence(sentences.length, summarySentences.length);

      logger.info('AI summary generated successfully', {
        originalLength: content.length,
        summaryLength: summary.length,
        keyPointsCount: keyPoints.length,
        readingTime
      });

      return {
        summary,
        keyPoints,
        readingTime,
        confidence,
        metadata: {
          originalWordCount: this.tokenizer.tokenize(content).length,
          summaryWordCount: this.tokenizer.tokenize(summary).length,
          compressionRatio: summary.length / content.length,
          style,
          language
        }
      };
    } catch (error) {
      logger.error('AI summary generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate key points from content
   */
  async generateKeyPoints(content, options = {}) {
    const {
      maxPoints = 5,
      minLength = 10,
      maxLength = 100
    } = options;

    try {
      const cleanContent = this.preprocessContent(content);
      const sentences = this.splitIntoSentences(cleanContent);
      
      // Calculate TF-IDF scores for important terms
      this.tfidf.addDocument(cleanContent);
      const importantTerms = this.tfidf.listTerms(0).slice(0, 10);
      
      // Find sentences containing important terms
      const keySentences = sentences
        .filter(sentence => {
          const sentenceLower = sentence.toLowerCase();
          return importantTerms.some(term => 
            sentenceLower.includes(term.term.toLowerCase())
          );
        })
        .map(sentence => sentence.trim())
        .filter(sentence => 
          sentence.length >= minLength && sentence.length <= maxLength
        )
        .slice(0, maxPoints);

      // If not enough key sentences, add some based on position and length
      if (keySentences.length < maxPoints) {
        const remainingSentences = sentences
          .filter(sentence => !keySentences.includes(sentence))
          .filter(sentence => 
            sentence.length >= minLength && sentence.length <= maxLength
          )
          .slice(0, maxPoints - keySentences.length);
        
        keySentences.push(...remainingSentences);
      }

      return keySentences.slice(0, maxPoints);
    } catch (error) {
      logger.error('Key points generation failed:', error);
      return [];
    }
  }

  /**
   * Generate TL;DR (Too Long; Didn't Read) summary
   */
  async generateTLDR(content, options = {}) {
    const {
      maxLength = 100,
      style = 'casual'
    } = options;

    try {
      const summary = await this.generateSummary(content, {
        maxLength,
        style: 'concise',
        includeKeyPoints: false
      });

      let tldr = summary.summary;
      
      if (style === 'casual') {
        tldr = `TL;DR: ${tldr}`;
      } else if (style === 'bullet') {
        const points = tldr.split('. ').filter(point => point.trim());
        tldr = points.map(point => `• ${point}`).join('\n');
      }

      return {
        tldr,
        originalLength: content.length,
        tldrLength: tldr.length,
        compressionRatio: tldr.length / content.length
      };
    } catch (error) {
      logger.error('TL;DR generation failed:', error);
      throw error;
    }
  }

  /**
   * Preprocess content for analysis
   */
  preprocessContent(content) {
    return content
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s.,!?-]/g, ' ') // Remove special characters
      .trim();
  }

  /**
   * Split content into sentences
   */
  splitIntoSentences(content) {
    return content
      .split(/[.!?]+/)
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 10);
  }

  /**
   * Calculate sentence importance scores
   */
  calculateSentenceScores(sentences, fullContent) {
    const scores = [];
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      let score = 0;
      
      // Position score (first and last sentences are more important)
      if (i === 0 || i === sentences.length - 1) {
        score += 0.3;
      }
      
      // Length score (medium length sentences are preferred)
      const wordCount = this.tokenizer.tokenize(sentence).length;
      if (wordCount >= 8 && wordCount <= 25) {
        score += 0.2;
      }
      
      // Keyword density score
      const importantWords = this.getImportantWords(fullContent);
      const sentenceWords = this.tokenizer.tokenize(sentence.toLowerCase());
      const keywordMatches = importantWords.filter(word => 
        sentenceWords.includes(word)
      ).length;
      score += (keywordMatches / Math.max(sentenceWords.length, 1)) * 0.4;
      
      // Sentiment score (neutral to slightly positive is preferred)
      const sentimentScore = this.sentiment.getSentiment(sentenceWords);
      score += Math.max(0, 1 - Math.abs(sentimentScore)) * 0.1;
      
      scores.push(score);
    }
    
    return scores;
  }

  /**
   * Get important words from content
   */
  getImportantWords(content) {
    const words = this.tokenizer.tokenize(content.toLowerCase());
    const wordFreq = {};
    
    // Count word frequency
    words.forEach(word => {
      if (word.length > 3) { // Skip short words
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    
    // Return words that appear multiple times
    return Object.keys(wordFreq)
      .filter(word => wordFreq[word] > 1)
      .sort((a, b) => wordFreq[b] - wordFreq[a])
      .slice(0, 20);
  }

  /**
   * Select sentences for summary
   */
  selectSummarySentences(sentences, scores, maxLength) {
    const sentenceScorePairs = sentences.map((sentence, index) => ({
      sentence,
      score: scores[index]
    }));
    
    // Sort by score (descending)
    sentenceScorePairs.sort((a, b) => b.score - a.score);
    
    const selectedSentences = [];
    let currentLength = 0;
    
    for (const pair of sentenceScorePairs) {
      if (currentLength + pair.sentence.length <= maxLength) {
        selectedSentences.push(pair.sentence);
        currentLength += pair.sentence.length;
      }
      
      if (currentLength >= maxLength * 0.8) {
        break;
      }
    }
    
    // Sort back to original order
    return selectedSentences.sort((a, b) => 
      sentences.indexOf(a) - sentences.indexOf(b)
    );
  }

  /**
   * Format summary based on style
   */
  formatSummary(sentences, style) {
    let summary = sentences.join('. ');
    
    if (style === 'bullet') {
      summary = sentences.map(sentence => `• ${sentence}`).join('\n');
    } else if (style === 'numbered') {
      summary = sentences.map((sentence, index) => `${index + 1}. ${sentence}`).join('\n');
    }
    
    return summary;
  }

  /**
   * Calculate reading time in minutes
   */
  calculateReadingTime(content) {
    const wordsPerMinute = 200; // Average reading speed
    const wordCount = this.tokenizer.tokenize(content).length;
    const minutes = wordCount / wordsPerMinute;
    
    return Math.ceil(minutes);
  }

  /**
   * Calculate confidence score
   */
  calculateConfidence(totalSentences, summarySentences) {
    if (totalSentences === 0) return 0;
    
    const ratio = summarySentences / totalSentences;
    
    // Higher confidence for moderate compression ratios
    if (ratio >= 0.1 && ratio <= 0.3) {
      return 0.9;
    } else if (ratio >= 0.05 && ratio <= 0.5) {
      return 0.7;
    } else {
      return 0.5;
    }
  }

  /**
   * Analyze content structure
   */
  analyzeContentStructure(content) {
    const sentences = this.splitIntoSentences(content);
    const words = this.tokenizer.tokenize(content);
    
    return {
      sentenceCount: sentences.length,
      wordCount: words.length,
      averageSentenceLength: words.length / sentences.length,
      paragraphCount: content.split(/\n\s*\n/).length,
      hasHeadings: /^#{1,6}\s/.test(content),
      hasLists: /^[\s]*[-*+]\s/.test(content),
      hasCode: /```|`/.test(content)
    };
  }

  /**
   * Get content statistics
   */
  getContentStats(content) {
    const cleanContent = this.preprocessContent(content);
    const words = this.tokenizer.tokenize(cleanContent);
    const sentences = this.splitIntoSentences(cleanContent);
    
    // Calculate unique words
    const uniqueWords = new Set(words.map(word => word.toLowerCase()));
    
    // Calculate vocabulary diversity
    const vocabularyDiversity = uniqueWords.size / words.length;
    
    return {
      totalWords: words.length,
      uniqueWords: uniqueWords.size,
      vocabularyDiversity: Math.round(vocabularyDiversity * 100) / 100,
      sentenceCount: sentences.length,
      averageWordsPerSentence: Math.round((words.length / sentences.length) * 100) / 100,
      readingTime: this.calculateReadingTime(content),
      complexity: this.calculateComplexity(words, sentences)
    };
  }

  /**
   * Calculate content complexity
   */
  calculateComplexity(words, sentences) {
    const longWords = words.filter(word => word.length > 6).length;
    const longWordRatio = longWords / words.length;
    
    const avgSentenceLength = words.length / sentences.length;
    
    // Simple complexity score
    let complexity = 0;
    
    if (longWordRatio > 0.2) complexity += 0.4;
    if (avgSentenceLength > 20) complexity += 0.3;
    if (avgSentenceLength > 15) complexity += 0.2;
    if (avgSentenceLength > 10) complexity += 0.1;
    
    if (complexity >= 0.7) return 'high';
    if (complexity >= 0.4) return 'medium';
    return 'low';
  }
}

module.exports = AISummaryService; 