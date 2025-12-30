# 体检报告分析状态图

```mermaid
stateDiagram-v2
    [*] --> ReportUpload: 用户上传体检报告

    state ReportUpload {
        [*] --> FileSelection
        FileSelection --> FileValidation: 选择文件
        FileValidation --> Uploading: 验证通过
        FileValidation --> SelectionError: 验证失败
        SelectionError --> FileSelection: 重新选择
        Uploading --> UploadComplete: 上传成功
        Uploading --> UploadError: 上传失败
        UploadError --> FileSelection: 重新上传
        UploadComplete --> [*]
    }

    ReportUpload --> OCRProcessing: 文件上传完成

    state OCRProcessing {
        [*] --> ImagePreprocessing
        ImagePreprocessing --> TextRecognition: 图像预处理
        TextRecognition --> DataExtraction: 文字识别
        DataExtraction --> Structuring: 数据提取
        Structuring --> OCRSuccess: 处理成功
        Structuring --> OCRError: 处理失败
        OCRError --> ImagePreprocessing: 重试处理
        OCRSuccess --> [*]
    }

    OCRProcessing --> MetricValidation: OCR识别完成

    state MetricValidation {
        [*] --> DataCleaning
        DataCleaning --> ValueRangeCheck: 数据清洗
        ValueRangeCheck --> MedicalValidation: 数值范围检查
        MedicalValidation --> ValidationSuccess: 验证通过
        MedicalValidation --> ValidationFailed: 验证失败
        ValidationFailed --> ManualReview: 需人工审核
        ManualReview --> ValidationSuccess: 审核通过
        ValidationSuccess --> [*]
    }

    MetricValidation --> RuleEngineProcessing: 数据验证完成

    state RuleEngineProcessing {
        [*] --> LoadMedicalRules
        LoadMedicalRules --> ContraindicationCheck: 加载医学规则
        ContraindicationCheck --> RiskAssessment: 禁忌症检查
        RiskAssessment --> GenerateRecommendations: 风险评估
        GenerateRecommendations --> ApplySafetyConstraints: 生成建议
        ApplySafetyConstraints --> RuleEngineComplete: 应用安全约束
        RuleEngineComplete --> [*]
    }

    RuleEngineProcessing --> AIAnalysis: 规则引擎处理完成

    state AIAnalysis {
        [*] --> ContextAnalysis
        ContextAnalysis --> PersonalizedInsights: 上下文分析
        PersonalizedInsights --> TrendAnalysis: 个性化洞察
        TrendAnalysis --> HealthScore: 趋势分析
        HealthScore --> ReportGeneration: 健康评分
        ReportGeneration --> AIAnalysisComplete: 生成报告
        AIAnalysisComplete --> [*]
    }

    AIAnalysis --> ReportFinalization: AI分析完成

    state ReportFinalization {
        [*] --> QualityCheck
        QualityCheck --> AddDisclaimers: 质量检查
        AddDisclaimers --> GeneratePDF: 添加免责声明
        GeneratePDF --> UserNotification: 生成PDF报告
        UserNotification --> ArchiveReport: 用户通知
        ArchiveReport --> ReportComplete: 存档报告
        ReportComplete --> [*]
    }

    ReportFinalization --> UserReview: 报告生成完成

    UserReview --> ReportAccepted: 用户接受结果
    UserReview --> ReportRejection: 用户拒绝结果
    ReportRejection --> ManualReview: 转人工审核
    ManualReview --> ReportFinalization: 重新处理

    ReportAccepted --> [*]: 分析流程完成

    %% 错误处理状态
    ReportUpload --> UploadTimeout: 上传超时
    OCRProcessing --> OCRTimeout: OCR处理超时
    MetricValidation --> ValidationError: 验证错误
    RuleEngineProcessing --> RuleEngineError: 规则引擎错误
    AIAnalysis --> AIError: AI分析错误

    UploadTimeout -->[*]: 流程终止
    OCRTimeout -->[*]: 流程终止
    ValidationError -->[*]: 流程终止
    RuleEngineError -->[*]: 流程终止
    AIError -->[*]: 流程终止

    %% 状态转换说明
    note right of ReportUpload: 支持PDF/JPG/PNG格式<br/>最大文件大小: 10MB
    note right of OCRProcessing: 使用Tesseract OCR<br/>支持中英文识别
    note right of MetricValidation: 基于医学标准<br/>正常值范围检查
    note right of RuleEngineProcessing: ACSM医学指南<br/>安全约束验证
    note right of AIAnalysis: GPT-4模型<br/>个性化分析
    note right of ReportFinalization: 符合医疗规范<br/>包含免责声明
```