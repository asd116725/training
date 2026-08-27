# Caffeine 使用 Demo

本 Demo 在当前 Spring Boot 项目中接入 Caffeine，用一个独立的模拟数据源展示最常见的本地缓存操作。它不缓存现有用户或食材数据，因此不会改变业务逻辑，也不会产生跨用户缓存串用问题。教学接口默认关闭，只有显式启用 `caffeine-demo` Profile 后才会注册。

## 1. Demo 包含什么

| 文件 | 作用 |
| --- | --- |
| `pom.xml` | 引入 Spring Cache 和 Caffeine，版本由 Spring Boot BOM 统一管理 |
| `CaffeineCacheConfig.java` | 在 Demo Profile 下开启 Spring Cache，创建独立命名的 `CaffeineCacheManager` |
| `CaffeineDemoService.java` | 演示 `@Cacheable`、`@CachePut` 和 `@CacheEvict` |
| `CaffeineDemoController.java` | 提供可直接调用的 REST 接口 |
| `CaffeineDemoDtos.java` | 定义缓存值和统计响应 |
| `CaffeineDemoServiceTest.java` | 验证命中、更新、失效、清空和统计 |
| `CaffeineDemoControllerTest.java` | 验证 REST 接口契约 |
| `CaffeineDemoProfileTest.java` | 验证教学接口默认关闭、按 Profile 开启 |

## 2. 依赖说明

`pom.xml` 增加了两个依赖：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-cache</artifactId>
</dependency>
<dependency>
    <groupId>com.github.ben-manes.caffeine</groupId>
    <artifactId>caffeine</artifactId>
</dependency>
```

- `spring-boot-starter-cache` 提供 Spring Cache 抽象和注解支持。
- `caffeine` 是真正保存数据、执行过期和淘汰策略的本地缓存实现。
- 依赖没有手写版本号，当前项目由 Spring Boot 4.0.6 的 BOM 管理兼容版本。

Spring Cache 是统一接口，Caffeine 是底层实现。业务代码主要依赖 Spring 注解，以后如果切换缓存实现，Service 的改动会比较小。

## 3. 缓存配置

`CaffeineCacheConfig` 使用 Java Builder 创建缓存：

```java
Caffeine.newBuilder()
        .maximumSize(100)
        .expireAfterWrite(Duration.ofMinutes(10))
        .recordStats();
```

| 配置 | 当前值 | 含义 |
| --- | ---: | --- |
| 缓存名 | `caffeine-demo` | Service 中所有示例方法共同使用的缓存区域 |
| 管理器名 | `caffeineDemoCacheManager` | 由 Demo 注解显式引用，与业务缓存名隔离 |
| `maximumSize` | `100` | 缓存最多保留约 100 个条目，超过后按 Caffeine 策略淘汰低价值条目 |
| `expireAfterWrite` | `10 分钟` | 条目创建或更新 10 分钟后过期，读取不会延长有效期 |
| `recordStats` | 开启 | 记录命中、未命中、加载和淘汰数据 |
| `allowNullValues` | 关闭 | 不把 `null` 包装后写入缓存，避免把“无数据”和“缓存命中”混淆 |

这里选择 `expireAfterWrite`，是因为它能保证一个热点条目即使被持续读取，也会定期重新从数据源加载。若数据更像登录会话，希望每次访问都续期，可以改用 `expireAfterAccess`。

## 4. 四个缓存注解如何工作

| Service 方法 | 注解 | 行为 |
| --- | --- | --- |
| `find(key)` | `@Cacheable(key = "#key", sync = true)` | 先查缓存；命中时直接返回，未命中时执行方法并缓存返回值 |
| `update(key, value)` | `@CachePut(key = "#key")` | 方法始终执行，并用返回值覆盖对应缓存 |
| `evict(key)` | `@CacheEvict(key = "#key")` | 方法成功结束后删除指定 key |
| `clear()` | `@CacheEvict(allEntries = true)` | 方法成功结束后清空整个 `caffeine-demo` 缓存 |

`sync = true` 用于同一个 key 并发首次加载的场景。多个线程同时未命中时，缓存会合并这次加载，避免所有线程同时访问数据库或远程接口。它只约束同一个 key，不会阻塞不同 key 的正常加载。

Demo 使用另一个最多保存 100 条数据的本地 Caffeine 容器模拟数据库或远程接口，并通过 `sourceSequence` 标记数据源实际执行次数。这里限制模拟数据源容量，是为了避免教学接口被反复写入不同 key 后无限占用堆内存。它是可能淘汰旧值的有损教学容器，不能等同于持久化数据库：

- 两次返回的 `sourceSequence` 和 `cachedAt` 完全相同，说明第二次命中缓存，方法体没有再次执行。
- 失效后再次查询时 `sourceSequence` 增大，说明数据重新从模拟数据源加载。
- `clear()` 只清外层缓存，不会主动删除模拟数据源中的值；但模拟数据源超过 100 条后仍可能自行淘汰旧值。

正式业务中，可以把模拟数据源替换成 Repository 或远程 API，缓存注解的使用方式不变。

## 5. 运行与调用

### 5.1 执行 Demo 测试

测试使用最小 Spring 上下文获取代理后的 Service，不会连接 MySQL。

```bash
cd java
./mvnw -Dtest=CaffeineDemoProfileTest,CaffeineDemoServiceTest,CaffeineDemoControllerTest test
```

执行全部后端测试：

```bash
./mvnw test
```

### 5.2 启动项目

启动完整项目仍需按后端 README 配置 MySQL：

```bash
SPRING_PROFILES_ACTIVE=caffeine-demo \
MYSQL_USER=root MYSQL_PASSWORD=你的密码 \
./mvnw spring-boot:run
```

未启用 `caffeine-demo` 时，这些教学接口不会注册；请求先经过项目现有登录拦截器，未登录会得到 `401`，鉴权通过后才会得到 `404`。启用后，Demo 位于 `/api/**` 下，仍会遵守相同的登录校验。先通过 `/api/auth/login` 获取 token，再设置：

```bash
export TOKEN='登录接口返回的 token'
```

### 5.3 首次查询：缓存未命中

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/demo/caffeine/entries/protein
```

示例响应：

```json
{
  "key": "protein",
  "value": "数据源自动生成：protein",
  "sourceSequence": 1,
  "cachedAt": "2026-08-26T06:00:00Z"
}
```

用相同命令再次查询。第二次响应中的 `sourceSequence` 和 `cachedAt` 不变，表示缓存命中。

### 5.4 查看统计

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/demo/caffeine/stats
```

连续查询同一个新 key 两次后，典型结果如下：

```json
{
  "estimatedSize": 1,
  "requestCount": 2,
  "hitCount": 1,
  "missCount": 1,
  "loadSuccessCount": 1,
  "evictionCount": 0,
  "hitRate": 0.5
}
```

字段含义：

- `estimatedSize`：当前缓存条目估算数量。
- `requestCount`：读取请求总数，等于命中数加未命中数。
- `hitCount`：直接从缓存返回的次数。
- `missCount`：没有找到缓存值的次数。
- `loadSuccessCount`：未命中后成功计算并写入的次数。
- `evictionCount`：因容量等策略被自动淘汰的次数；主动删除通常不计入策略淘汰。
- `hitRate`：命中数除以总读取数。

### 5.5 主动更新缓存

```bash
curl -X PUT -H "Authorization: Bearer $TOKEN" \
  --get --data-urlencode "value=每天摄入足量蛋白质" \
  http://localhost:8080/api/demo/caffeine/entries/protein
```

`@CachePut` 会执行更新方法，并把返回值立刻放入缓存。之后查询 `protein` 会直接得到新值。

### 5.6 使单个 key 失效

```bash
curl -i -X DELETE -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/demo/caffeine/entries/protein
```

接口返回 `204 No Content`。下一次查询会重新执行 `find` 方法，但仍能从模拟数据源读到主动更新后的值。

### 5.7 清空全部示例缓存

```bash
curl -i -X DELETE -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/demo/caffeine/entries
```

该操作只清空 `caffeine-demo` 缓存区域，不影响其他数据。

接口限制 key 最多 64 个字符、value 最多 200 个字符，并拒绝空白值；它仍然只适合本地学习和调试，不应作为生产管理接口开放。

## 6. Spring Cache 常见注意点

### 必须通过 Spring 代理调用

缓存注解由 Spring AOP 代理执行。以下两种方式不会触发缓存：

- 在测试中直接 `new CaffeineDemoService(...)`。
- 在同一个类中使用 `this.find(key)` 自调用缓存方法。

本 Demo 的测试通过最小 Spring 容器注入 Service，Controller 也通过构造器注入代理对象，所以注解能够生效。

### 缓存 key 必须包含数据隔离维度

本 Demo 只按 `key` 缓存无敏感信息。真实业务如果返回值与用户、租户、语言或权限有关，这些维度必须进入缓存 key。

例如当前项目的 `FoodService.listFoods()` 没有方法参数，如果直接加 `@Cacheable`，默认 key 会相同，可能导致不同用户共享结果。真实改造时至少要把用户 ID 放入 key，并为新增、修改、删除设计完整的失效规则。

### 过期不等于定时任务

过期条目在读取时不会再作为有效结果返回，但物理清理通常由后续读写触发的维护过程完成。若业务要求到点立即触发删除监听器，需要额外配置 Caffeine `Scheduler`。

### `@CachePut` 不提供跨资源事务

`@CachePut` 在方法成功返回后才把返回值写入缓存，它不会让“数据库写入”和“缓存写入”自动变成一个原子操作。两个同 key 的并发更新可能发生写入顺序交错，真实业务需要根据一致性要求选择版本号校验、同 key 串行化，或更新数据库后只执行 `@CacheEvict`，让下一次查询重新加载最新数据。

本 Demo 保留 `@CachePut` 是为了展示注解语义，不宣称它能解决并发写一致性。

### 本地缓存不等于分布式缓存

Caffeine 数据只存在于当前 JVM：

- 应用重启后缓存丢失。
- 多实例部署时，每个实例拥有独立缓存。
- 一个实例执行 `@CacheEvict`，不会自动通知其他实例。

当前个人单实例项目很适合使用 Caffeine。如果未来横向扩容，并且缓存数据要求跨实例一致，应考虑 Redis 或设计缓存失效广播机制。

## 7. 可选的 Spring Boot 属性配置

本 Demo 为了清楚展示 Caffeine Builder，显式声明了专用 `CaffeineCacheManager`。如果应用只需要一个默认缓存管理器，并希望完全使用 Spring Boot 自动配置，可以删除自定义 `CacheManager` Bean，并改用：

```properties
spring.cache.type=caffeine
spring.cache.cache-names=caffeine-demo
spring.cache.caffeine.spec=maximumSize=100,expireAfterWrite=10m,recordStats
```

显式 Bean 和自动配置二选一即可，不要同时维护两份策略。

## 8. 官方参考

- [Spring Boot 缓存支持](https://docs.spring.io/spring-boot/reference/io/caching.html)
- [Spring Framework 缓存注解](https://docs.spring.io/spring-framework/reference/integration/cache/annotations.html)
- [Caffeine 数据加载方式](https://github.com/ben-manes/caffeine/wiki/Population)
- [Caffeine 淘汰与过期策略](https://github.com/ben-manes/caffeine/wiki/Eviction)
- [Caffeine 统计信息](https://github.com/ben-manes/caffeine/wiki/Statistics)
