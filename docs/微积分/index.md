!!! 数学工具
	- 函数 - [反函数](https://www.numberempire.com/inversefunctioncalculator.php)，[泰勒展开](https://www.numberempire.com/taylorseriesexpansion.php)
	- 代数 - [表达式求值](https://www.numberempire.com/expressioncalculator.php)，[方程求解](https://www.numberempire.com/equationsolver.php)，[因式分解](https://www.numberempire.com/factoringcalculator.php)，[表达式简化](https://www.numberempire.com/simplifyexpression.php)
	- 微积分 - [极限](https://www.numberempire.com/limitcalculator.php)，[微分](https://www.numberempire.com/derivativecalculator.php)，[不定积分](https://www.numberempire.com/integralcalculator.php)，[定积分](https://www.numberempire.com/definiteintegralcalculator.php)，[级数](https://www.numberempire.com/seriescalculator.php)



### 解题原则 ###

```title="解题原则(p91)"
理解:
	- 未知量？已知量？条件/限制？
	- 画图，恰当的符号
思考 - 已知量如何联系未知量？
	- 题目的模式: 几何？数值？代数？
	- 类推
	- 引入额外的东西？(辅助的变量？直线？)
	- {==分类讨论==}（如何组合？比如：求关于绝对值函数的不等式的解）
	- 逆向操作 - 假设问题已经解决，反向一步一步操作，直到推出已知数据？
	- 分治/动态规划？
	- 间接推理（反证。。）？
	- {==数学归纳法==}:  (在解决包含正整数n的题目时，下面的法则经常很有用)
		- 令 S_n 为与正整数 n 有关的陈述
		- 假设:
			1.	S_1 为真
			2.	只要 S_k 真，S_{k+1}就真
			3.	则对所有的正整数n，S_n 真
		- 解决的问题:
			- 通过 数列首项和递推式 求 数列通项
				- 根据数列前几项(至少两项)表达式猜测数列的公式 (寻找模式)
				- 然后通过数学归纳法证明正确性	
	- 反证法：
		- 一个定理除了一个条件外其他条件均成立，假设这个条件成立
		- 但是如果这种假设使得定理的结果不成立，那么这个条件不成立
		- 应用：结合rolle定理反证 函数 f 没有不小于2个的零点
回顾:
	- 检查解题的正确性
	- 思考更简单的解法
	- 使得解题方法更熟系
```

!!! quote "笛卡尔"
	我解决过的每一个问题都成为为后来解决其他问题服务的规则

!!! question
	- 如何计算多项式的因子？
	- 有用的代数方法有哪些？
	- 函数在a处 有定义，极限存在，间断，连续，导数不存在(可导)，可微 的联系？
	- 平滑？不可微？

```mermaid
graph LR
有定义 --> 连续
```

!!! idea
	- 低次多项式 除 高次多项式 会得到 两个低次多项式 + 一个常数  =>  这个方法可以用来凑因子 简化微积分！！！
		- 如果这个常数为零，意味着这个低次多项式整除这个高次多项式
		- 多项式除法的思想可以借鉴10进制数的除法，x就能代表 多少进制
	- 做证明时，注意从证明的假设条件或已知条件出发，并且注意等价化简要证明的数学模型
	- 灵活运用微积分定理的组合！！

!!! warning
	- 区间的定义：如$[a, b) \iff \{x | a \le x \lt b \}$
		- 注意到区间是一段连续的点的集合，如果集合内缺少某些点就不叫区间了（在某些定理的条件里一定要注意区间的意思！）

!!! 常见函数
	- $x^4 + x^4 = c$ (c > 0) - 扁平圆
	- $x^2 + y^2 = (2x^2 + 2y^2 - x)^2$ - 心形线
	- $x^{2/3} + y^{2/3} = 4$ - 星形线

[英语词汇](https://zhuanlan.zhihu.com/p/134603058)


!!! note
	- 两个重要人物：Leibniz（莱布尼茨），Newton（牛顿）
	- 事实上，2500年前， Eudoxus（欧多克斯） 和 Archimedes（阿基米德）已经研究和揭示了积分的基本思想
	- Pierre Fermat（费马）和Issac Barrow则率先提出了求切线的方法



